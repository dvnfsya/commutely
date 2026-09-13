"""Read-only mapping of the existing public.facilities24h table.

This metadata is intentionally isolated from the application's Alembic metadata.
"""

from geoalchemy2 import Geometry
from sqlalchemy import Column, MetaData, String, Table


facilities24h = Table(
    "facilities24h",
    MetaData(),
    Column("id", String, primary_key=True),
    # The database declares this as 4326, although its coordinate values are UTM 48S.
    Column("geom", Geometry("MULTIPOINTZ", srid=4326, spatial_index=False)),
    Column("name", String),
    Column("category", String),
    Column("address", String),
    Column("phone", String),
    Column("website", String),
    Column("rating", String),
    schema="public",
)
