import json

import httpx

from app.core.config import Settings
from app.schemas.mapid import ActivitiesRequest, ActivitiesResponse


class MAPIDError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _read_layer_json(url: str, params: dict[str, str], settings: Settings, client: httpx.Client):
    """Pass through structured GeoMAPID JSON without changing spatial data."""
    key = settings.mapid_api_key.get_secret_value().strip()
    if not key:
        raise MAPIDError(503, "MAPID service is not configured.")
    try:
        response = client.get(url, params={**params, "api_key": key})
        response.raise_for_status()
    except httpx.TimeoutException:
        raise MAPIDError(504, "MAPID provider timed out.") from None
    except httpx.HTTPStatusError:
        raise MAPIDError(502, "MAPID provider rejected the request.") from None
    except httpx.RequestError:
        raise MAPIDError(502, "MAPID provider is unavailable.") from None

    try:
        payload = response.json()
        encoded_key = json.dumps(key, ensure_ascii=False)[1:-1]
        if encoded_key in json.dumps(payload, ensure_ascii=False, allow_nan=False):
            raise ValueError
        if not isinstance(payload, (dict, list)):
            raise ValueError
        if isinstance(payload, list) and any(not isinstance(item, dict) for item in payload):
            raise ValueError
        if isinstance(payload, dict) and (
            not payload or payload.get("success") is False or payload.get("error")
        ):
            raise ValueError
        return payload
    except (ValueError, TypeError, RecursionError):
        raise MAPIDError(502, "MAPID provider returned an invalid response.") from None


def list_layers(project_id: str, settings: Settings, client: httpx.Client):
    return _read_layer_json(str(settings.mapid_layer_list_url), {"project_id": project_id}, settings, client)


def get_layer(project_id: str, layer_id: str, settings: Settings, client: httpx.Client):
    return _read_layer_json(
        str(settings.mapid_layer_url), {"project_id": project_id, "layer_id": layer_id}, settings, client,
    )


def get_activities(request: ActivitiesRequest, settings: Settings, client: httpx.Client) -> ActivitiesResponse:
    key = settings.mapid_api_key.get_secret_value().strip()
    if not key:
        raise MAPIDError(503, "MAPID service is not configured.")
    try:
        response = client.post(
            str(settings.mapid_activities_url),
            headers={"X-API-KEY": key},
            json=request.model_dump(mode="json", exclude_none=True),
        )
        response.raise_for_status()
    except httpx.TimeoutException:
        raise MAPIDError(504, "MAPID provider timed out.") from None
    except httpx.HTTPStatusError:
        raise MAPIDError(502, "MAPID provider rejected the request.") from None
    except httpx.RequestError:
        raise MAPIDError(502, "MAPID provider is unavailable.") from None

    try:
        payload = response.json()
        # Check decoded content, including escaped secrets and nested fields.
        encoded_key = json.dumps(key, ensure_ascii=False)[1:-1]
        if encoded_key in json.dumps(payload, ensure_ascii=False, allow_nan=False):
            raise ValueError
        if payload["success"] is not True:
            raise ValueError
        result = ActivitiesResponse.model_validate({
            "activities": payload["data"]["activities"],
            "filters": payload["meta"]["filters"],
            "total": payload["meta"]["total"],
        })
        if result.total != len(result.activities):
            raise ValueError
        # MAPID has no limit/offset parameters; dated requests are uncapped.
        if request.start_date is None and len(result.activities) > 60:
            raise ValueError
        return result
    except (ValueError, KeyError, TypeError, AttributeError, RecursionError):
        raise MAPIDError(502, "MAPID provider returned an invalid response.") from None
