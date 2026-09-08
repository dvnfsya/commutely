import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.schemas.routing import RoutingRequest, RoutingResponse

ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions"


class RoutingError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def get_route(request: RoutingRequest, settings: Settings, client: httpx.Client) -> RoutingResponse:
    key = settings.ors_api_key.get_secret_value().strip()
    if not key:
        raise RoutingError(503, "Routing service is not configured.")
    try:
        response = client.post(
            f"{ORS_DIRECTIONS_URL}/{request.profile}/geojson",
            headers={"Authorization": key, "Accept": "application/geo+json"},
            json={
                "coordinates": [list(request.origin), list(request.destination)],
                "units": "m",
                "instructions": False,
                "elevation": False,
            },
        )
        response.raise_for_status()
    except httpx.TimeoutException:
        raise RoutingError(504, "Routing provider timed out.") from None
    except httpx.RequestError:
        raise RoutingError(502, "Routing provider is unavailable.") from None
    except httpx.HTTPStatusError:
        raise RoutingError(502, "Routing provider rejected the request.") from None

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
