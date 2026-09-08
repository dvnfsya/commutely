import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.routing import get_routing_client
from app.schemas.isochrone import IsochroneRequest, IsochroneResponse
from app.services.isochrone import get_isochrone
from app.services.ors import ORSError

router = APIRouter(tags=["isochrone"])


@router.post("/isochrone", response_model=IsochroneResponse)
def isochrone(
    payload: IsochroneRequest,
    request: Request,
    client: httpx.Client = Depends(get_routing_client),
) -> IsochroneResponse:
    try:
        return get_isochrone(payload, request.app.state.settings, client)
    except ORSError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from None
