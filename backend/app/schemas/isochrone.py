from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.routing import Coordinates

TimeRange = Annotated[int, Field(strict=True, gt=0, le=900)]
Ring = Annotated[list[Coordinates], Field(min_length=4)]


class IsochroneRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    location: Coordinates
    profile: Literal["foot-walking"] = "foot-walking"
    ranges: Annotated[list[TimeRange], Field(min_length=1, max_length=3)] = Field(
        default_factory=lambda: [300, 600, 900]
    )

    @field_validator("ranges")
    @classmethod
    def ordered_ranges(cls, values):
        if values != sorted(set(values)):
            raise ValueError("Ranges must be unique and strictly increasing seconds.")
        return values


class IsochroneGeometry(BaseModel):
    type: Literal["Polygon"]
    coordinates: Annotated[list[Ring], Field(min_length=1)]

    @field_validator("coordinates")
    @classmethod
    def closed_rings(cls, rings):
        for ring in rings:
            if ring[0] != ring[-1] or len(set(ring[:-1])) < 3:
                raise ValueError("Polygon rings must be closed with three distinct vertices.")
        return rings


class IsochroneProperties(BaseModel):
    duration_s: Annotated[float, Field(strict=True, gt=0, le=900, allow_inf_nan=False)]


class IsochroneFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    properties: IsochroneProperties
    geometry: IsochroneGeometry


class IsochroneResponse(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: Annotated[list[IsochroneFeature], Field(min_length=1, max_length=3)]
