from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints

from app.schemas.routing import Coordinates

SearchQuery = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=200)]


class GeocodingLocation(BaseModel):
    label: Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=1000)]
    coordinates: Coordinates
    type: Literal["address", "location"]


class GeocodingResponse(BaseModel):
    locations: list[GeocodingLocation]
