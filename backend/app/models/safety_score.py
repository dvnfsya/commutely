"""Final external analysis values. Core mapping because no PK is declared.

station_id is a nullable logical reference to station.id, not a database FK.
Do not invent an ORM primary key from the currently unique non-null values.
"""

from sqlalchemy import Column, Integer, Numeric, String, Table

from app.db.base import Base

safety_score = Table(
    "safety_score", Base.metadata,
    Column("id", String),
    Column("name", String),
    Column("lighting_count", Integer),
    Column("halte_dropoff_category", String),
    Column("economic_activity_24h_count", Integer),
    Column("health_facility_count", Integer),
    Column("police_station_count", Integer),
    Column("train_schedule_intensity", Integer),
    Column("waiting_time_score", Numeric),
    Column("lighting_std", Numeric),
    Column("halte_dropoff_std", Numeric),
    Column("economic_activity_std", Numeric),
    Column("train_schedule_std", Numeric),
    Column("waiting_time_std", Numeric),
    Column("health_facility_std", Numeric),
    Column("police_station_std", Numeric),
    Column("safety_score", Numeric),
    Column("category", String),
    Column("rank", Integer),
    Column("station_id", String),
    schema="public",
)
