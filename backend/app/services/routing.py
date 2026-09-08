import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.routing import RoutingRequest, RoutingResponse
from app.services.ors import ORSError as RoutingError, post_ors


def get_route(request: RoutingRequest, settings: Settings, client: httpx.Client) -> RoutingResponse:
    response = post_ors(
        f"directions/{request.profile}/geojson",
        {
            "coordinates": [list(request.origin), list(request.destination)],
            "units": "m",
            "instructions": False,
            "elevation": False,
        },
        settings, client, "Routing",
    )

    try:
        payload = response.json()
        if payload.get("error") or payload["type"] != "FeatureCollection":
            raise ValueError
        feature = payload["features"][0]
        if feature["type"] != "Feature":
            raise ValueError
        summary = feature["properties"]["summary"]
        return RoutingResponse(
            distance_m=summary["distance"],
            duration_s=summary["duration"],
            geometry=feature["geometry"],
        )
    except (ValueError, KeyError, IndexError, TypeError, AttributeError, ValidationError):
        raise RoutingError(502, "Routing provider returned an invalid response.") from None
