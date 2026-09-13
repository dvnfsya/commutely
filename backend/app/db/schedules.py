"""Read-only queries for the existing schedule table; no DDL or reflection."""

from sqlalchemy import String, Time, column, select, table
from sqlalchemy.orm import Session

krl_schedule = table(
    "krl_schedule",
    column("station_id", String),
    column("station_name", String),
    column("departure_time", Time),
    column("destination", String),
    schema="public",
)


def schedule_for_station(session: Session, station_id: str):
    statement = select(krl_schedule).where(
        krl_schedule.c.station_id == station_id,
    ).order_by(krl_schedule.c.departure_time.asc())
    return session.execute(statement).mappings().all()
