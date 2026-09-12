"""SELECT-only access to the existing station and final score tables."""

from sqlalchemy import JSON, cast, func, select
from sqlalchemy.orm import Session

from app.models import Station, safety_score

SCORE_FIELDS = (
    "id", "name", "lighting_count", "halte_dropoff_category",
    "economic_activity_24h_count", "health_facility_count", "police_station_count",
    "train_schedule_intensity", "waiting_time_score", "safety_score", "category",
    "rank", "station_id",
)


def list_stations(session: Session):
    statement = select(
        Station.id, Station.name, Station.provinsi, Station.kota,
        Station.kecamatan, Station.kelurahan,
        cast(func.ST_AsGeoJSON(Station.geom, 15), JSON).label("geometry"),
    ).order_by(Station.id)
    return session.execute(statement).mappings().all()


def score_query():
    return select(*(safety_score.c[name] for name in SCORE_FIELDS))


def list_scores(session: Session):
    return session.execute(score_query().order_by(
        safety_score.c.station_id, safety_score.c.id,
    )).mappings().all()


def station_exists(session: Session, station_id: str) -> bool:
    return session.execute(select(Station.id).where(Station.id == station_id)).scalar_one_or_none() is not None


def score_for_station(session: Session, station_id: str):
    return session.execute(score_query().where(
        safety_score.c.station_id == station_id,
    )).mappings().one_or_none()
