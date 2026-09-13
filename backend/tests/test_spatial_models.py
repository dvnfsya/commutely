from decimal import Decimal
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
import pytest
from sqlalchemy import Integer, Numeric, String, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import configure_mappers

from app.db.base import Base
from app.models import (
    HalteDropoff, HalteTransjakarta, HealthFacility, Lighting,
    PoliceStation, Railway, Station, safety_score,
)
from app.models.facility_24h import facilities24h


@pytest.mark.parametrize("model,geometry", [
    (Station, "POINT"), (HalteDropoff, "POINT"), (Lighting, "POINT"),
    (HealthFacility, "POINT"), (PoliceStation, "POINT"), (Railway, "MULTILINESTRING"),
])
def test_spatial_mapping(model, geometry):
    table = model.__table__
    assert table.schema == "public"
    assert isinstance(table.c.id.type, String)
    assert table.c.id.primary_key
    assert table.c.id.identity is None
    assert table.c.geom.type.geometry_type == geometry
    assert table.c.geom.type.srid == 4326
    assert not table.c.geom.type.spatial_index
    assert not table.indexes


def test_station_columns():
    assert list(Station.__table__.columns.keys()) == [
        "id", "geom", "fid", "name", "provinsi", "kota", "kecamatan", "kelurahan",
    ]
    assert Station.__tablename__ == "station"
    assert "public.stations" not in Base.metadata.tables
    assert "public.facilities" not in Base.metadata.tables


def test_facilities24h_mapping_matches_existing_geometry_and_rating_columns():
    table = facilities24h
    assert table.schema == "public"
    assert table.c.geom.type.geometry_type == "MULTIPOINTZ"
    assert table.c.geom.type.srid == 4326
    assert isinstance(table.c.rating.type, String)
    assert table.metadata is not Base.metadata


def test_exact_identifiers_and_generic_transjakarta_geometry():
    configure_mappers()
    assert isinstance(HalteTransjakarta.__table__.c.id.type, Integer)
    assert HalteTransjakarta.__table__.c.geom.type.geometry_type == "GEOMETRY"
    assert HalteTransjakarta.__table__.c.geom.type.srid == -1
    statement = select(HalteTransjakarta.corridor, Railway.shape_length, PoliceStation.source_metadata)
    sql = str(statement.compile(dialect=postgresql.dialect()))
    assert '"corridor "' in sql
    assert '"shape_Length"' in sql
    assert "police_station.metadata" in sql


def test_safety_score_has_no_invented_keys_or_calculation():
    assert not safety_score.primary_key.columns
    assert safety_score.c.station_id.nullable
    assert isinstance(safety_score.c.safety_score.type, Numeric)
    assert safety_score.c.safety_score.type.asdecimal
    assert safety_score.c.safety_score.type.python_type is Decimal
    assert all(c.default is None and c.server_default is None for c in safety_score.columns)
    assert len(safety_score.columns) == 20
    statement = select(Station.id, safety_score.c.safety_score).outerjoin(
        safety_score, Station.id == safety_score.c.station_id,
    )
    sql = str(statement.compile(dialect=postgresql.dialect()))
    assert "LEFT OUTER JOIN public.safety_score ON public.station.id = public.safety_score.station_id" in sql


def test_no_invented_foreign_keys_or_indexes():
    for table in Base.metadata.tables.values():
        assert not table.foreign_keys
        assert not table.indexes
    assert HalteDropoff.__table__.c.station_id.nullable


def test_legacy_revision_is_only_discovered_not_executed():
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    scripts = ScriptDirectory.from_config(config)
    assert scripts.get_heads() == ["0001_core_spatial"]
