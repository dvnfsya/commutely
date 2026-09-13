from collections.abc import Generator
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import JsonValue, StringConstraints

from app.schemas.mapid import ActivitiesRequest, ActivitiesResponse
from app.services.mapid import MAPIDError, get_activities, get_layer, list_layers

router = APIRouter(prefix="/mapid", tags=["mapid"])
LayerIdentifier = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
LayerJSON = dict[str, JsonValue] | list[dict[str, JsonValue]]


def get_mapid_client() -> Generator[httpx.Client, None, None]:
    with httpx.Client(timeout=httpx.Timeout(30.0, connect=5.0), follow_redirects=False) as client:
        yield client


@router.post("/activities", response_model=ActivitiesResponse)
def activities(
    payload: ActivitiesRequest,
    request: Request,
    client: httpx.Client = Depends(get_mapid_client),
) -> ActivitiesResponse:
    """Read-only spatial search; POST carries the polygon and optional filters."""
    try:
        return get_activities(payload, request.app.state.settings, client)
    except MAPIDError as error:
        raise HTTPException(error.status_code, error.detail) from None


@router.get("/layers", response_model=LayerJSON)
def layers(
    request: Request,
    project_id: Annotated[LayerIdentifier, Query()],
    client: httpx.Client = Depends(get_mapid_client),
):
    try:
        return list_layers(project_id, request.app.state.settings, client)
    except MAPIDError as error:
        raise HTTPException(error.status_code, error.detail) from None


@router.get("/layer", response_model=LayerJSON)
def layer(
    request: Request,
    project_id: Annotated[LayerIdentifier, Query()],
    layer_id: Annotated[LayerIdentifier, Query()],
    client: httpx.Client = Depends(get_mapid_client),
):
    try:
        return get_layer(project_id, layer_id, request.app.state.settings, client)
    except MAPIDError as error:
        raise HTTPException(error.status_code, error.detail) from None
