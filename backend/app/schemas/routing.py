from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

Longitude = Annotated[float, Field(strict=True, ge=-180, le=180, allow_inf_nan=False)]
Latitude = Annotated[float, Field(strict=True, ge=-90, le=90, allow_inf_nan=False)]
Coordinates = tuple[Longitude, Latitude]
NonnegativeNumber = Annotated[float, Field(strict=True, ge=0, allow_inf_nan=False)]


class RoutingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    origin: Coordinates
    destination: Coordinates
    profile: Literal["foot-walking"] = "foot-walking"


class RouteGeometry(BaseModel):
    type: Literal["LineString"]
    coordinates: Annotated[list[Coordinates], Field(min_length=2)]


class RoutingResponse(BaseModel):
    distance_m: NonnegativeNumber
    duration_s: NonnegativeNumber
    geometry: RouteGeometry
