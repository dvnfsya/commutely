"""Create stations and facilities with WGS84 point locations.

Revision ID: 0001_core_spatial
Revises: None
"""

from alembic import op
from geoalchemy2 import Geometry
import sqlalchemy as sa

revision = "0001_core_spatial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Do not install or relocate extensions. Require the existing PostGIS schema
    # on the migration role's search_path so geometry types/functions resolve.
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'postgis'
            ) THEN
                RAISE EXCEPTION 'PostGIS must be enabled before this migration';
            END IF;
            IF pg_catalog.to_regtype('geometry') IS NULL THEN
                RAISE EXCEPTION 'PostGIS schema must be on the migration search_path';
            END IF;
        END $$;
    """)
    op.create_table(
        "stations",
        sa.Column("id", sa.BigInteger(), sa.Identity(), nullable=False),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("location", Geometry("POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("area", sa.String(120), nullable=True),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("source_id", sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_stations_code"),
        schema="public",
    )
    op.create_index("ix_stations_location", "stations", ["location"], schema="public", postgresql_using="gist")
    op.create_table(
        "facilities",
        sa.Column("id", sa.BigInteger(), sa.Identity(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("location", Geometry("POINT", srid=4326, spatial_index=False), nullable=False),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("source_id", sa.String(255), nullable=True),
        sa.Column("is_24_hours", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="public",
    )
    op.create_index("ix_facilities_location", "facilities", ["location"], schema="public", postgresql_using="gist")
    op.create_index("ix_facilities_category", "facilities", ["category"], schema="public")


def downgrade():
    op.drop_index("ix_facilities_category", table_name="facilities", schema="public")
    op.drop_index("ix_facilities_location", table_name="facilities", schema="public")
    op.drop_table("facilities", schema="public")
    op.drop_index("ix_stations_location", table_name="stations", schema="public")
    op.drop_table("stations", schema="public")
