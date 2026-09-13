from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def api():
    session = MagicMock()
    session.execute.return_value.mappings.return_value.one_or_none.return_value = {
        "station_id": "TBT", "station_name": "Tebet", "has_location": True,
        "lighting": 17, "police": 1, "health": 2, "retail_24h": 4,
    }
    def fake_db():
        try:
            yield session
        finally:
            session.close()
    with patch("app.api.stations.get_db", fake_db), patch(
        "app.db.session.get_engine", side_effect=AssertionError("No Supabase access in tests")
    ):
        with TestClient(create_app(Settings(_env_file=None))) as client:
            yield client, session
    session.commit.assert_not_called()
    session.flush.assert_not_called()


@pytest.mark.parametrize("query,radius", [("", 100), ("?radius_m=250", 250), ("?radius_m=75.5", 75.5)])
def test_counts_identity_and_radius(api, query, radius):
    client, session = api
    response = client.get(f"/api/v1/stations/TBT/facilities{query}")
    assert response.status_code == 200
    assert response.json() == {"station_id": "TBT", "station_name": "Tebet", "radius_m": radius,
                               "counts": {"lighting": 17, "police": 1, "health": 2, "retail_24h": 4}}
    assert session.execute.call_args.args[1] == {"station_id": "TBT", "radius_m": radius}
    assert str(session.execute.call_args_list[0].args[0]) == "SET TRANSACTION READ ONLY"
    session.close.assert_called_once()


def test_retail_transform_and_geography_aggregation(api):
    client, session = api
    assert client.get("/api/v1/stations/TBT/facilities").status_code == 200
    sql = " ".join(str(session.execute.call_args.args[0]).split())
    assert "ST_Transform(ST_SetSRID(f.geom, 32748), 4326)::geography" in sql
    assert sql.count("ST_DWithin(") == 4
    assert sql.count("SELECT count(*)") == 4
    for table in ("lighting", "police_station", "health_facility", "facilities24h"):
        assert f"FROM public.{table} f" in sql
    assert "WHERE s.id = :station_id" in sql
    assert session.execute.call_count == 2


def test_unknown_station(api):
    client, session = api
    session.execute.return_value.mappings.return_value.one_or_none.return_value = None
    assert client.get("/api/v1/stations/UNKNOWN/facilities").status_code == 404


@pytest.mark.parametrize("radius", ["0", "-1", "nan", "inf", "abc", ""])
def test_invalid_radius(api, radius):
    client, session = api
    assert client.get(f"/api/v1/stations/TBT/facilities?radius_m={radius}").status_code == 400
    assert all(str(call.args[0]) == "SET TRANSACTION READ ONLY" for call in session.execute.call_args_list)


def test_missing_geometry_does_not_fabricate_counts(api):
    client, session = api
    session.execute.return_value.mappings.return_value.one_or_none.return_value["has_location"] = False
    assert client.get("/api/v1/stations/TBT/facilities").status_code == 422


def test_database_error_is_sanitized(api):
    client, session = api
    session.execute.side_effect = SQLAlchemyError("secret")
    response = client.get("/api/v1/stations/TBT/facilities")
    assert response.status_code == 503
    assert "secret" not in response.text
