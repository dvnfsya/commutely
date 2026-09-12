from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import MultipleResultsFound, SQLAlchemyError

from app.core.config import Settings
from app.main import create_app
from app.schemas.stations import SafetyScoreResponse, StationResponse


@pytest.fixture
def station():
    return {
        "id": "station-01", "name": "Test station", "provinsi": "Jakarta",
        "kota": None, "kecamatan": None, "kelurahan": None,
        "geometry": {"type": "Point", "coordinates": [106.82, -6.2]},
    }


@pytest.fixture
def score():
    return {
        "id": "score-01", "name": "Test station", "lighting_count": 4,
        "halte_dropoff_category": "near", "economic_activity_24h_count": 2,
        "health_facility_count": 1, "police_station_count": 0,
        "train_schedule_intensity": 12, "waiting_time_score": Decimal("0.123456789"),
        "safety_score": Decimal("72.123456789"), "category": "stored category",
        "rank": 3, "station_id": "station-01",
    }


@pytest.fixture
def api():
    session = MagicMock()

    def fake_db():
        try:
            yield session
        finally:
            session.close()

    # Replace only database creation: exercise the real dependency and queries.
    with patch("app.api.stations.get_db", fake_db), patch(
        "app.db.session.get_engine", side_effect=AssertionError("No live database allowed")
    ):
        with TestClient(create_app(Settings(_env_file=None))) as client:
            yield client, session
    session.commit.assert_not_called()
    session.flush.assert_not_called()


def query(session):
    assert str(session.execute.call_args_list[0].args[0]) == "SET TRANSACTION READ ONLY"
    return session.execute.call_args.args[0].compile(dialect=postgresql.dialect())


def test_stations_success(api, station):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = [station]
    response = client.get("/api/v1/stations")
    assert response.status_code == 200
    assert response.json() == [station]
    sql = str(query(session))
    assert "ST_AsGeoJSON(public.station.geom" in sql
    assert "FROM public.station" in sql
    assert "ORDER BY public.station.id" in sql
    session.close.assert_called_once()


def test_safety_scores_success(api, score):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = [score]
    response = client.get("/api/v1/safety-scores")
    assert response.status_code == 200
    assert response.json() == [{
        **score, "waiting_time_score": "0.123456789", "safety_score": "72.123456789",
    }]
    statement = session.execute.call_args.args[0]
    assert list(statement.selected_columns.keys()) == list(score)
    assert "FROM public.safety_score" in str(query(session))


def test_station_score_success(api, score):
    client, session = api
    session.execute.return_value.scalar_one_or_none.return_value = "station-01"
    session.execute.return_value.mappings.return_value.one_or_none.return_value = score
    response = client.get("/api/v1/stations/station-01/safety-score")
    assert response.status_code == 200
    assert response.json() == SafetyScoreResponse.model_validate(score).model_dump(mode="json")
    compiled = query(session)
    assert "WHERE public.safety_score.station_id =" in str(compiled)
    assert "station-01" in compiled.params.values()
    exists = session.execute.call_args_list[1].args[0].compile(dialect=postgresql.dialect())
    assert "WHERE public.station.id =" in str(exists)
    assert "station-01" in exists.params.values()


@pytest.mark.parametrize("exists,detail,calls", [
    ("station-01", "No Safety Score is available for this station.", 3),
    (None, "Station not found.", 2),
])
def test_missing_station_or_score(api, exists, detail, calls):
    client, session = api
    session.execute.return_value.scalar_one_or_none.return_value = exists
    session.execute.return_value.mappings.return_value.one_or_none.return_value = None
    response = client.get("/api/v1/stations/station-01/safety-score")
    assert response.status_code == 404
    assert response.json() == {"detail": detail}
    assert session.execute.call_count == calls


@pytest.mark.parametrize("path", ["stations", "safety-scores"])
def test_empty_results(api, path):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = []
    response = client.get(f"/api/v1/{path}")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize("geometry", [
    {"type": "LineString", "coordinates": [106.82, -6.2]},
    {"type": "Point", "coordinates": [-6.2, 106.82]},
    {"type": "Point", "coordinates": [181, 0]},
    {"type": "Point", "coordinates": [106.82]},
])
def test_invalid_station_geometry(station, geometry):
    with pytest.raises(ValidationError):
        StationResponse.model_validate({**station, "geometry": geometry})


def test_nullable_values_are_preserved(station, score):
    assert StationResponse.model_validate({**station, "geometry": None}).geometry is None
    nullable = dict.fromkeys(score)
    assert SafetyScoreResponse.model_validate(nullable).model_dump() == nullable


@pytest.mark.parametrize("field,value", [
    ("lighting_count", 1.5), ("safety_score", "invalid"), ("station_id", 123),
])
def test_invalid_score_schema(score, field, value):
    with pytest.raises(ValidationError):
        SafetyScoreResponse.model_validate({**score, field: value})


def test_invalid_stored_response(api, station):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = [{**station, "id": None}]
    response = client.get("/api/v1/stations")
    assert response.status_code == 500
    assert response.json() == {"detail": "Stored station or Safety Score data has an invalid format."}


@pytest.mark.parametrize("error,status", [(SQLAlchemyError("secret"), 503), (MultipleResultsFound("secret"), 409)])
def test_database_errors_are_sanitized(api, error, status):
    client, session = api
    session.execute.side_effect = error
    response = client.get("/api/v1/stations")
    assert response.status_code == status
    assert "secret" not in response.text
