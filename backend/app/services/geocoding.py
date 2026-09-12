import httpx

from app.core.config import Settings
from app.schemas.geocoding import GeocodingLocation, GeocodingResponse
from app.services.ors import ORSError, autocomplete_ors


def autocomplete(query: str, settings: Settings, client: httpx.Client) -> GeocodingResponse:
    response = autocomplete_ors(query, settings, client)
    try:
        payload = response.json()
        if payload.get("error") or payload.get("geocoding", {}).get("errors") or payload["type"] != "FeatureCollection":
            raise ValueError
        features = payload["features"]
        if not isinstance(features, list):
            raise ValueError
        locations = []
        for feature in features[:8]:
            if feature["type"] != "Feature" or feature["geometry"]["type"] != "Point":
                raise ValueError
            properties = feature["properties"]
            locations.append(GeocodingLocation(
                label=properties["label"], coordinates=feature["geometry"]["coordinates"],
                type="address" if properties.get("layer") == "address" else "location",
            ))
        return GeocodingResponse(locations=locations)
    except (ValueError, KeyError, IndexError, TypeError, AttributeError):
        raise ORSError(502, "Geocoding provider returned an invalid response.") from None
