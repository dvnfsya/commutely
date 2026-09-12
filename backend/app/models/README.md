# Supabase mappings

Models follow the actual schema supplied for TASK A, using `public` and the
existing Base. They do not create tables, indexes, foreign keys, or data.
The obsolete prototype `stations`/`facilities` models are no longer registered.

- Non-PK columns are mapped nullable because additional NOT NULL constraints
  were not specified. No varchar length, numeric precision, identity, index,
  or FK is inferred from the earlier prototype migration.
- Point layers use SRID 4326; railway uses MultiLineString, SRID 4326.
- `halte_transjakarta.geom` remains generic geometry with unknown SRID (`-1`),
  matching the supplied unconstrained geometry definition. Do not assume 4326
  for this layer until its actual data SRID has been confirmed.
- `corridor` maps the exact SQL column `"corridor "`; `shape_length` maps
  `"shape_Length"`; `source_metadata` maps `metadata`, avoiding DeclarativeBase's
  reserved `metadata` attribute.
- `safety_score` is a Core Table without a fabricated PK. Numeric values remain
  Decimal. Read final QGIS/external results with SELECT; do not calculate them.
  The reported 42 unique non-null station_id values permit an explicit logical
  join to station.id, but do not constitute a PK/FK or guarantee future uniqueness.
  Nullable station_id records must not be silently lost by an invented ORM key.
- `halte_dropoff.station_id` is nullable and has no FK or automatic relationship.

Alembic imports these mappings through app.models. The historical revision
0001_core_spatial describes the obsolete prototype, not this Supabase schema.
It is preserved as history and must not be applied to Supabase. No migration was
created or executed for this alignment. Tests inspect mappings and compile SELECT
statements without a live database or executing upgrade/downgrade commands.
