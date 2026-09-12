from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

from app.schemas.routing import Coordinates


class StationGeometry(BaseModel):
    type: Literal["Point"]
    coordinates: Coordinates


class StationResponse(BaseModel):
    id: str
    name: str | None
    provinsi: str | None
    kota: str | None
    kecamatan: str | None
    kelurahan: str | None
    geometry: StationGeometry | None


class SafetyScoreResponse(BaseModel):
    id: str | None
    name: str | None
    lighting_count: int | None
    halte_dropoff_category: str | None
    economic_activity_24h_count: int | None
    health_facility_count: int | None
    police_station_count: int | None
    train_schedule_intensity: int | None
    waiting_time_score: Decimal | None
    safety_score: Decimal | None
    category: str | None
    rank: int | None
    station_id: str | None
