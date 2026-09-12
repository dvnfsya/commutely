from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.routing import get_routing_client
from app.schemas.geocoding import GeocodingResponse, SearchQuery
from app.services.geocoding import autocomplete
from app.services.ors import ORSError

router = APIRouter(tags=["geocoding"])


@router.get("/geocoding/autocomplete", response_model=GeocodingResponse)
def search_locations(
    request: Request,
    q: Annotated[SearchQuery, Query()],
    client: httpx.Client = Depends(get_routing_client),
) -> GeocodingResponse:
    try:
        return autocomplete(q, request.app.state.settings, client)
    except ORSError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from None
