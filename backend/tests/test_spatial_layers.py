from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import SQLAlchemyError

from app.api.spatial_layers import PJU_LIMIT
from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def api():
    session = MagicMock()
    def fake_db():
        yield session
    with patch("app.api.stations.get_db", fake_db):
        with TestClient(create_app(Settings(_env_file=None))) as client:
            yield client, session
    session.commit.assert_not_called()
    session.flush.assert_not_called()


@pytest.mark.parametrize("layer,table", [("stations", "station"), ("health", "health_facility"), ("police", "police_station"), ("lighting?bbox=106,-7,107,-6", "lighting")])
def test_points_and_read_only_query(api, layer, table):
    client, session = api
    row = {"id": "point-1", "geometry": {"type": "Point", "coordinates": [106.5, -6.5]}}
    session.execute.return_value.mappings.return_value.all.return_value = [row]
    response = client.get(f"/api/v1/layers/{layer}")
    assert response.status_code == 200
    assert response.json() == {"type": "FeatureCollection", "features": [{
        "type": "Feature", "geometry": row["geometry"], "properties": {"id": "point-1", "name": None},
    }], "zoom_in_required": False}
    assert str(session.execute.call_args_list[0].args[0]) == "SET TRANSACTION READ ONLY"
    sql = str(session.execute.call_args.args[0].compile(dialect=postgresql.dialect()))
    assert f"FROM public.{table}" in sql
    assert "ST_AsGeoJSON" in sql


def test_pju_spatial_index_predicate_and_bounded_fetch(api):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = []
    assert client.get("/api/v1/layers/lighting?bbox=106,-7,107,-6").status_code == 200
    compiled = session.execute.call_args.args[0].compile(dialect=postgresql.dialect())
    sql = str(compiled)
    assert "lighting.geom && ST_MakeEnvelope" in sql
    assert "ST_Intersects(public.lighting.geom, ST_MakeEnvelope" in sql
    assert "LIMIT" in sql
    assert PJU_LIMIT + 1 in compiled.params.values()
    assert "ST_Transform" not in sql


@pytest.mark.parametrize("count", [0, PJU_LIMIT, PJU_LIMIT + 1])
def test_pju_limit_and_empty(api, count):
    client, session = api
    row = {"id": "pju", "geometry": {"type": "Point", "coordinates": [106.5, -6.5]}}
    session.execute.return_value.mappings.return_value.all.return_value = [row] * count
    response = client.get("/api/v1/layers/lighting?bbox=106,-7,107,-6")
    assert response.status_code == 200
    assert response.json()["zoom_in_required"] is (count > PJU_LIMIT)
    assert len(response.json()["features"]) == (0 if count > PJU_LIMIT else count)


@pytest.mark.parametrize("query", ["", "?bbox=1,2,3", "?bbox=nan,0,1,2", "?bbox=2,0,1,2", "?bbox=-181,0,1,2", "?bbox=0,0,1,91", "?bbox=0,0,0,1"])
def test_bad_bbox_rejected_without_spatial_select(api, query):
    client, session = api
    assert client.get(f"/api/v1/layers/lighting{query}").status_code == 422
    assert all(str(call.args[0]) == "SET TRANSACTION READ ONLY" for call in session.execute.call_args_list)


def test_database_failure_is_sanitized(api):
    client, session = api
    session.execute.side_effect = SQLAlchemyError("database-password")
    response = client.get("/api/v1/layers/health")
    assert response.status_code == 503
    assert "database-password" not in response.text
