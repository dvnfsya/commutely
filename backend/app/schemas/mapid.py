from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, JsonValue, model_validator

from app.schemas.routing import Coordinates


class ActivitiesPolygon(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["Polygon"]
    coordinates: list[list[Coordinates]] = Field(min_length=1)

    @model_validator(mode="after")
    def closed_rings(self):
        if any(len(ring) < 4 or ring[0] != ring[-1] for ring in self.coordinates):
            raise ValueError("Each polygon ring must have at least four points and be closed.")
        return self


class ActivitiesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    feature: ActivitiesPolygon
    start_date: date | None = None
    end_date: date | None = None
    hashtag: list[str] | None = None
    author: str | None = None

    @model_validator(mode="after")
    def date_range(self):
        if (self.start_date is None) != (self.end_date is None):
            raise ValueError("start_date and end_date must be provided together.")
        if self.start_date is not None and self.start_date > self.end_date:
            raise ValueError("start_date must not exceed end_date.")
        return self


class ActivitiesResponse(BaseModel):
    activities: list[dict[str, JsonValue]]
    filters: dict[str, JsonValue]
    total: int = Field(strict=True, ge=0)
