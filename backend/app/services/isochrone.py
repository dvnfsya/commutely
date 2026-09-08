import httpx

from app.core.config import Settings
from app.schemas.isochrone import IsochroneFeature, IsochroneRequest, IsochroneResponse
from app.services.ors import ORSError, post_ors


def get_isochrone(request: IsochroneRequest, settings: Settings, client: httpx.Client) -> IsochroneResponse:
    response = post_ors(
        f"isochrones/{request.profile}",
        {"locations": [list(request.location)], "range": request.ranges,
         "range_type": "time", "location_type": "start"},
        settings, client, "Isochrone",
    )
    try:
        payload = response.json()
        if payload.get("error") or payload["type"] != "FeatureCollection":
            raise ValueError
        features = []
        for feature in payload["features"]:
            features.append(IsochroneFeature(
                type=feature["type"],
                properties={"duration_s": feature["properties"]["value"]},
                geometry=feature["geometry"],
            ))
        features.sort(key=lambda item: item.properties.duration_s)
        if [item.properties.duration_s for item in features] != request.ranges:
            raise ValueError
        return IsochroneResponse(features=features)
    except (ValueError, KeyError, IndexError, TypeError, AttributeError):
        raise ORSError(502, "Isochrone provider returned an invalid response.") from None
