from collections.abc import Generator

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.schemas.routing import RoutingRequest, RoutingResponse
from app.services.routing import RoutingError, get_route

router = APIRouter(tags=["routing"])


def get_routing_client() -> Generator[httpx.Client, None, None]:
    with httpx.Client(timeout=httpx.Timeout(15.0, connect=5.0), follow_redirects=False) as client:
        yield client


@router.post("/routing", response_model=RoutingResponse)
def route(
    payload: RoutingRequest,
    request: Request,
    client: httpx.Client = Depends(get_routing_client),
) -> RoutingResponse:
    try:
        return get_route(payload, request.app.state.settings, client)
    except RoutingError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from None
