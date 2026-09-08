import runpy
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql

from app.core.config import Settings
from app.db.check import check_database, main
from app.db.session import create_database_engine, get_database_url, get_db
from app.main import create_app


def test_health_does_not_connect_to_database():
    settings = Settings(_env_file=None, database_url="not configured yet")
    with patch("app.db.session.create_engine") as create_engine:
        with TestClient(create_app(settings)) as client:
            assert client.get("/api/v1/health").json() == {"status": "ok"}
        create_engine.assert_not_called()


def test_database_url_from_environment(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:fake%40password@db.invalid/postgres")
    settings = Settings(_env_file=None)
    url = get_database_url(settings)
    assert url.drivername == "postgresql+psycopg"
    assert url.password == "fake@password"
    assert url.query["sslmode"] == "require"
    assert "fake" not in repr(settings)


@pytest.mark.parametrize("value", ["", "not a url", "sqlite:///test.db"])
def test_invalid_database_url(value):
    with pytest.raises(ValueError) as error:
        get_database_url(Settings(_env_file=None, database_url=value))
    assert "test.db" not in str(error.value)


def test_engine_is_lazy_and_preserves_ssl():
    settings = Settings(
        _env_file=None,
        database_url="postgresql://user:fake@db.invalid/postgres?sslmode=verify-full",
    )
    engine = create_database_engine(settings)
    try:
        assert engine.url.query["sslmode"] == "verify-full"
        assert engine.dialect.driver == "psycopg"
        assert engine.hide_parameters
    finally:
        engine.dispose()


@pytest.mark.parametrize("extension", [None, {"version": "3.5.0", "schema": "gis"}])
def test_read_only_database_check(extension):
    engine = MagicMock()
    connection = engine.connect.return_value.__enter__.return_value
    connection.execute.return_value.scalar_one.return_value = 1
    connection.execute.return_value.mappings.return_value.one_or_none.return_value = extension
    result = check_database(engine)
    assert result["database"] == "ok"
    assert result["postgis"]["enabled"] is (extension is not None)
    assert str(connection.execute.call_args_list[0].args[0]) == "SET TRANSACTION READ ONLY"
    assert connection.execute.call_args_list[-1].args[1] == {"name": "postgis"}
    if extension:
        assert result["postgis"]["schema"] == "gis"


def test_check_does_not_expose_connection_error(capsys):
    with patch("app.db.check.Settings", side_effect=ValueError("secret-credential")):
        assert main() == 1
    output = capsys.readouterr().out
    assert "secret-credential" not in output
    assert '"postgis": "unverified"' in output


def test_session_closes_on_failure():
    with patch("app.db.session.get_engine"), patch("app.db.session.Session") as session:
        dependency = get_db()
        next(dependency)
        with pytest.raises(RuntimeError):
            dependency.throw(RuntimeError("request failed"))
        session.return_value.__exit__.assert_called_once()


def test_geometry_type_compiles_without_database():
    assert Geometry("POINT", srid=4326).compile(dialect=postgresql.dialect()) == "geometry(POINT,4326)"


def test_alembic_offline_uses_shared_url_and_protects_existing_tables(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:fake%25pass@db.invalid/postgres")
    with patch("alembic.context.is_offline_mode", return_value=True), patch(
        "alembic.context.configure"
    ) as configure, patch("alembic.context.begin_transaction"), patch(
        "alembic.context.run_migrations"
    ):
        module = runpy.run_path(str(Path(__file__).parents[1] / "alembic" / "env.py"))
    assert configure.call_args.kwargs["url"].password == "fake%pass"
    assert set(configure.call_args.kwargs["target_metadata"].tables) == {
        "public.stations", "public.facilities"
    }
    include_object = module["include_object"]
    assert not include_object(None, "existing_supabase_table", "table", True, None)
