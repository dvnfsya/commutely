"""Aggregate existing facilities without changing stored geometries or schema."""

from sqlalchemy import text
from sqlalchemy.orm import Session

FACILITY_COUNTS = text("""
SELECT s.id AS station_id, s.name AS station_name,
       (s.geom IS NOT NULL AND NOT ST_IsEmpty(s.geom)) AS has_location,
       (SELECT count(*) FROM public.lighting f
        WHERE ST_DWithin(f.geom::geography, s.geom::geography, :radius_m)) AS lighting,
       (SELECT count(*) FROM public.police_station f
        WHERE ST_DWithin(f.geom::geography, s.geom::geography, :radius_m)) AS police,
       (SELECT count(*) FROM public.health_facility f
        WHERE ST_DWithin(f.geom::geography, s.geom::geography, :radius_m)) AS health,
       (SELECT count(*) FROM public.facilities24h f
        WHERE ST_DWithin(
            ST_Transform(ST_SetSRID(f.geom, 32748), 4326)::geography,
            s.geom::geography, :radius_m)) AS retail_24h
FROM public.station s
WHERE s.id = :station_id
""")


def counts_for_station(session: Session, station_id: str, radius_m: float):
    return session.execute(FACILITY_COUNTS, {
        "station_id": station_id, "radius_m": radius_m,
    }).mappings().one_or_none()
