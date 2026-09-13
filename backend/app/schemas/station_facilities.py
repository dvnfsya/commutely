from pydantic import BaseModel, Field


class FacilityCounts(BaseModel):
    lighting: int = Field(ge=0)
    police: int = Field(ge=0)
    health: int = Field(ge=0)
    retail_24h: int = Field(ge=0)


class StationFacilitiesResponse(BaseModel):
    station_id: str
    station_name: str | None
    radius_m: float
    counts: FacilityCounts
