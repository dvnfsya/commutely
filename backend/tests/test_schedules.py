from datetime import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.dialects import postgresql

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def api():
    session = MagicMock()

    def fake_db():
        try:
            yield session
        finally:
            session.close()

    with patch("app.api.stations.get_db", fake_db), patch(
        "app.db.session.get_engine", side_effect=AssertionError("No live database allowed")
    ):
        with TestClient(create_app(Settings(_env_file=None))) as client:
            yield client, session
    session.commit.assert_not_called()
    session.flush.assert_not_called()


def rows(*times):
    return [{"station_id": "TBT", "station_name": "Tebet", "departure_time": value,
             "destination": "BOGOR"} for value in times]


def test_success(api):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = rows(time(23, 13))
    response = client.get("/api/v1/stations/TBT/schedule")
    assert response.status_code == 200
    assert response.json() == {"station_id": "TBT", "station_name": "Tebet", "schedules": [
        {"departure_time": "23:13", "destination": "BOGOR"},
    ]}
    assert str(session.execute.call_args_list[0].args[0]) == "SET TRANSACTION READ ONLY"
    session.close.assert_called_once()


def test_query_orders_chronologically_and_only_reads_schedule(api):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = rows(time(0, 5), time(5, 9), time(23, 13))
    response = client.get("/api/v1/stations/TBT/schedule")
    assert [item["departure_time"] for item in response.json()["schedules"]] == ["00:05", "05:09", "23:13"]
    statement = session.execute.call_args.args[0]
    compiled = statement.compile(dialect=postgresql.dialect())
    assert "WHERE public.krl_schedule.station_id =" in str(compiled)
    assert "ORDER BY public.krl_schedule.departure_time ASC" in str(compiled)
    assert list(compiled.params.values()) == ["TBT"]
    assert [item.fullname for item in statement.get_final_froms()] == ["public.krl_schedule"]
    assert session.execute.call_count == 2


def test_no_schedule_returns_404(api):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = []
    response = client.get("/api/v1/stations/UNKNOWN/schedule")
    assert response.status_code == 404
    assert response.json() == {"detail": "No schedule is available for this station."}


@pytest.mark.parametrize("departure,expected", [(time(0, 0), "00:00"), (time(5, 3, 59), "05:03"), (time(23, 59), "23:59")])
def test_hh_mm_format(api, departure, expected):
    client, session = api
    session.execute.return_value.mappings.return_value.all.return_value = rows(departure)
    response = client.get("/api/v1/stations/TBT/schedule")
    assert response.status_code == 200
    assert response.json()["schedules"][0]["departure_time"] == expected
