from math import isfinite

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.stations import get_read_session
from app.db.station_facilities import counts_for_station
from app.schemas.station_facilities import FacilityCounts, StationFacilitiesResponse

router = APIRouter(tags=["stations"])


def parse_radius(radius_m: str = Query("100")) -> float:
    try:
        radius = float(radius_m)
        if not isfinite(radius) or radius <= 0:
            raise ValueError
        return radius
    except ValueError:
        raise HTTPException(400, "radius_m must be a positive finite distance in meters.") from None


@router.get("/stations/{station_id}/facilities", response_model=StationFacilitiesResponse)
def station_facilities(
    station_id: str,
    radius_m: float = Depends(parse_radius),
    session: Session = Depends(get_read_session),
):
    row = counts_for_station(session, station_id, radius_m)
    if row is None:
        raise HTTPException(404, "Station not found.")
    if not row["has_location"]:
        raise HTTPException(422, "Station location is unavailable.")
    return StationFacilitiesResponse(
        station_id=row["station_id"], station_name=row["station_name"], radius_m=radius_m,
        counts=FacilityCounts.model_validate(row),
    )
