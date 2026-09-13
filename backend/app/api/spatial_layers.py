from math import isfinite
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import JSON, cast, func, select
from sqlalchemy.orm import Session

from app.api.stations import get_read_session
from app.models import Facility24h, HealthFacility, Lighting, PoliceStation, Station
from app.schemas.stations import StationGeometry

router = APIRouter(prefix="/layers", tags=["spatial layers"])
PJU_LIMIT = 2000


class PointProperties(BaseModel):
    id: str
    name: str | None = None


class PointFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: StationGeometry
    properties: PointProperties


class PointCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[PointFeature]
    zoom_in_required: bool = False


class Facility24hProperties(BaseModel):
    name: str | None = None
    category: str | None = None
    address: str | None = None
    phone: str | None = None
    website: str | None = None
    rating: float | None = None


class Facility24hFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: StationGeometry
    properties: Facility24hProperties


class Facility24hCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[Facility24hFeature]
    zoom_in_required: bool = False


def parse_bbox(bbox: str = Query(..., description="west,south,east,north in EPSG:4326")):
    try:
        west, south, east, north = [float(part) for part in bbox.split(",")]
        if not all(isfinite(v) for v in (west, south, east, north)):
            raise ValueError
        if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
            raise ValueError
        return west, south, east, north
    except ValueError:
        raise HTTPException(422, "bbox must be west,south,east,north with valid ordered WGS84 bounds.") from None


def point_query(model):
    columns = [model.id, cast(func.ST_AsGeoJSON(model.geom, 15), JSON).label("geometry")]
    if model is not Lighting:
        columns.append(model.name)
    return select(*columns).where(model.geom.is_not(None), ~func.ST_IsEmpty(model.geom))


def collection(rows):
    return PointCollection(features=[PointFeature(
        geometry=row["geometry"], properties=PointProperties(id=row["id"], name=row.get("name")),
    ) for row in rows])


def facilities24h_query():
    # Coordinates were stored in UTM Zone 48S despite the column's declared 4326 SRID.
    geometry = cast(func.ST_AsGeoJSON(
        func.ST_Transform(func.ST_SetSRID(Facility24h.geom, 32748), 4326), 15,
    ), JSON).label("geometry")
    return select(
        geometry, Facility24h.name, Facility24h.category, Facility24h.address,
        Facility24h.phone, Facility24h.website, Facility24h.rating,
    ).where(Facility24h.geom.is_not(None), ~func.ST_IsEmpty(Facility24h.geom))


@router.get("/facilities24h", response_model=Facility24hCollection)
def facilities24h(session: Session = Depends(get_read_session)):
    rows = session.execute(facilities24h_query()).mappings().all()
    return Facility24hCollection(features=[Facility24hFeature(
        geometry=row["geometry"],
        properties=Facility24hProperties(**{
            key: row.get(key) for key in Facility24hProperties.model_fields
        }),
    ) for row in rows])


@router.get("/stations", response_model=PointCollection)
def stations(session: Session = Depends(get_read_session)):
    return collection(session.execute(point_query(Station)).mappings().all())


@router.get("/health", response_model=PointCollection)
def health(session: Session = Depends(get_read_session)):
    return collection(session.execute(point_query(HealthFacility)).mappings().all())


@router.get("/police", response_model=PointCollection)
def police(session: Session = Depends(get_read_session)):
    return collection(session.execute(point_query(PoliceStation)).mappings().all())


@router.get("/lighting", response_model=PointCollection)
def lighting(bbox: tuple = Depends(parse_bbox), session: Session = Depends(get_read_session)):
    envelope = func.ST_MakeEnvelope(*bbox, 4326)
    # The && predicate uses the existing geom spatial index, without transforming geom.
    statement = point_query(Lighting).where(
        Lighting.geom.op("&&")(envelope), func.ST_Intersects(Lighting.geom, envelope),
    ).limit(PJU_LIMIT + 1)
    rows = session.execute(statement).mappings().all()
    if len(rows) > PJU_LIMIT:
        return PointCollection(features=[], zoom_in_required=True)
    return collection(rows)
