"""Shared ORS authentication, HTTP transport and sanitized failures."""

import httpx

from app.core.config import Settings

ORS_BASE_URL = "https://api.openrouteservice.org/v2"


class ORSError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def post_ors(path: str, body: dict, settings: Settings, client: httpx.Client, service: str) -> httpx.Response:
    return _request_ors("POST", f"{ORS_BASE_URL}/{path}", settings, client, service, json=body)


def autocomplete_ors(query: str, settings: Settings, client: httpx.Client) -> httpx.Response:
    return _request_ors(
        "GET", "https://api.openrouteservice.org/geocode/autocomplete",
        settings, client, "Geocoding",
        params={"text": query, "boundary.country": "IDN",
                "focus.point.lon": 106.8272, "focus.point.lat": -6.2045},
    )


def _request_ors(method: str, url: str, settings: Settings, client: httpx.Client, service: str, **kwargs) -> httpx.Response:
    key = settings.ors_api_key.get_secret_value().strip()
    if not key:
        raise ORSError(503, f"{service} service is not configured.")
    try:
        response = client.request(
            method, url,
            headers={"Authorization": key, "Accept": "application/geo+json"},
            **kwargs,
        )
        response.raise_for_status()
        return response
    except httpx.TimeoutException:
        raise ORSError(504, f"{service} provider timed out.") from None
    except httpx.RequestError:
        raise ORSError(502, f"{service} provider is unavailable.") from None
    except httpx.HTTPStatusError:
        raise ORSError(502, f"{service} provider rejected the request.") from None
