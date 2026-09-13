from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.routing import router as routing_router
from app.api.isochrone import router as isochrone_router
from app.api.assistant import router as assistant_router
from app.api.geocoding import router as geocoding_router
from app.api.stations import router as stations_router
from app.api.mapid import router as mapid_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(routing_router)
api_router.include_router(isochrone_router)
api_router.include_router(assistant_router)
api_router.include_router(geocoding_router)
api_router.include_router(stations_router)
api_router.include_router(mapid_router)
