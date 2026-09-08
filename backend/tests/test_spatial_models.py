from io import StringIO
from pathlib import Path
from unittest.mock import patch

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
import pytest
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from app.models import Facility, Station


@pytest.mark.parametrize("model", [Station, Facility])
def test_point_geometry_and_index(model):
    table = model.__table__
    assert table.schema == "public"
    assert table.c.id.primary_key
    assert table.c.id.identity is not None
    location = table.c.location
    assert not location.nullable
    assert location.type.geometry_type == "POINT"
    assert location.type.srid == 4326
    indexes = [index for index in table.indexes if "location" in index.columns]
    assert len(indexes) == 1
    assert indexes[0].dialect_options["postgresql"]["using"] == "gist"
    assert "geometry(POINT,4326) NOT NULL" in str(CreateTable(table).compile(dialect=postgresql.dialect()))


def test_identity_and_metadata_constraints():
    station = Station.__table__
    assert any(
        isinstance(constraint, UniqueConstraint) and list(constraint.columns.keys()) == ["code"]
        for constraint in station.constraints
    )
    assert not station.c.code.nullable
    assert not Facility.__table__.c.category.nullable
    assert not Facility.__table__.c.source.nullable
    assert Facility.__table__.c.is_24_hours.nullable  # Unknown is not false.
    assert Facility.__table__.c.is_24_hours.default is None


def migration_config(output=None):
    return Config(str(Path(__file__).parents[1] / "alembic.ini"), output_buffer=output)


def test_initial_revision_detected():
    scripts = ScriptDirectory.from_config(migration_config())
    assert scripts.get_heads() == ["0001_core_spatial"]
    assert scripts.get_revision("head").down_revision is None


def test_migration_sql_without_database(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://offline:unused@db.invalid/postgres")
    output = StringIO()
    with patch("app.db.session.create_database_engine", side_effect=AssertionError("No live connections")):
        command.upgrade(migration_config(output), "head", sql=True)
    sql = output.getvalue()
    assert "PostGIS must be enabled" in sql
    assert "search_path" in sql
    assert "CREATE EXTENSION" not in sql
    for model in (Station, Facility):
        table = model.__table__
        # Compare emitted table DDL to the ORM metadata, including nullability.
        expected = str(CreateTable(table).compile(dialect=postgresql.dialect()))
        assert " ".join(expected.split()) in " ".join(sql.split())
        assert sql.count(f"CREATE INDEX ix_{table.name}_location") == 1
        assert f"ON public.{table.name} USING gist (location)" in sql
    output = StringIO()
    with patch("app.db.session.create_database_engine", side_effect=AssertionError("No live connections")):
        command.downgrade(migration_config(output), "0001_core_spatial:base", sql=True)
    sql = output.getvalue()
    assert sql.index("DROP TABLE public.facilities") < sql.index("DROP TABLE public.stations")
    assert "DROP EXTENSION" not in sql
