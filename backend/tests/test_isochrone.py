from copy import deepcopy
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError

from app.api.routing import get_routing_client
from app.core.config import Settings
from app.main import create_app
from app.schemas.isochrone import IsochroneRequest

LOCATION = [106.8226, -6.2021]
RING = [[106.82, -6.20], [106.83, -6.20], [106.83, -6.19], [106.82, -6.20]]


def provider_response(ranges=(300, 600, 900)):
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [deepcopy(RING)]},
         "properties": {"value": value, "group_index": 0, "center": LOCATION}}
        for value in ranges
    ], "metadata": {"private": "not returned"}}


@pytest.fixture
def api():
    state = {"payload": provider_response(), "status": 200, "error": None}
    calls = []
    settings = Settings(_env_file=None, ors_api_key="test-only-secret")

    def handler(request):
        calls.append(request)
        if state["error"]:
            raise state["error"]("test-only-secret", request=request)
        if isinstance(state["payload"], bytes):
            return httpx.Response(state["status"], content=state["payload"])
        return httpx.Response(state["status"], json=state["payload"])

    app = create_app(settings)
    with httpx.Client(transport=httpx.MockTransport(handler)) as upstream:
        app.dependency_overrides[get_routing_client] = lambda: upstream
        with TestClient(app) as client:
            yield client, state, calls, settings


def test_defaults_and_ors_contract(api):
    client, _, calls, _ = api
    response = client.post("/api/v1/isochrone", json={"location": LOCATION})
    assert response.status_code == 200
    assert response.json() == {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {"duration_s": value},
         "geometry": {"type": "Polygon", "coordinates": [RING]}}
        for value in (300, 600, 900)
    ]}
    assert len(calls) == 1
    assert str(calls[0].url) == "https://api.openrouteservice.org/v2/isochrones/foot-walking"
    assert calls[0].headers["Authorization"] == "test-only-secret"
    assert calls[0].headers["Accept"] == "application/geo+json"
    assert json.loads(calls[0].content) == {
        "locations": [LOCATION], "range": [300, 600, 900],
        "range_type": "time", "location_type": "start",
    }


@pytest.mark.parametrize("ranges", [[300], [300, 900], [1, 600, 900]])
def test_custom_ranges_and_provider_order(api, ranges):
    client, state, _, _ = api
    state["payload"] = provider_response(reversed(ranges))
    response = client.post("/api/v1/isochrone", json={"location": LOCATION, "ranges": ranges})
    assert response.status_code == 200
    assert [f["properties"]["duration_s"] for f in response.json()["features"]] == ranges


@pytest.mark.parametrize("changes", [
    {"location": [-6.2, 106.8]}, {"location": [181, 0]}, {"location": [0, -91]},
    {"location": [0]}, {"location": [0, 1, 2]}, {"location": [True, 0]},
    {"location": ["106", 0]}, {"location": None}, {"profile": "driving-car"},
    {"ranges": []}, {"ranges": [0]}, {"ranges": [-300]}, {"ranges": [901]},
    {"ranges": [72001]}, {"ranges": [1, 2, 3, 4]}, {"ranges": list(range(1, 12))},
    {"ranges": [300, 300]}, {"ranges": [600, 300]}, {"ranges": [True]},
    {"ranges": [300.5]}, {"ranges": ["300"]}, {"ranges": None}, {"units": "minutes"},
])
def test_validation_prevents_requests(api, changes):
    client, _, calls, _ = api
    response = client.post("/api/v1/isochrone", json={"location": LOCATION, **changes})
    assert response.status_code == 422
    assert calls == []


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_nonfinite_coordinate(value):
    with pytest.raises(ValidationError):
        IsochroneRequest(location=[value, 0])


def test_missing_key(api):
    client, _, calls, settings = api
    settings.ors_api_key = SecretStr(" ")
    response = client.post("/api/v1/isochrone", json={"location": LOCATION})
    assert response.status_code == 503
    assert response.json() == {"detail": "Isochrone service is not configured."}
    assert calls == []


@pytest.mark.parametrize("status", [301, 400, 401, 403, 429, 500])
def test_http_failure(api, status):
    client, state, _, _ = api
    state.update(status=status, payload={"error": "test-only-secret"})
    response = client.post("/api/v1/isochrone", json={"location": LOCATION})
    assert response.status_code == 502
    assert "test-only-secret" not in response.text


@pytest.mark.parametrize("error,status", [(httpx.ReadTimeout, 504), (httpx.ConnectTimeout, 504), (httpx.ConnectError, 502)])
def test_network_failure(api, error, status):
    client, state, _, _ = api
    state["error"] = error
    response = client.post("/api/v1/isochrone", json={"location": LOCATION})
    assert response.status_code == status
    assert "test-only-secret" not in response.text


@pytest.mark.parametrize("payload", [None, [], {}, b"not json", {"error": "secret"},
    {"type": "FeatureCollection", "features": []}, provider_response([300, 600]),
    provider_response([300, 300, 900]), provider_response([300, 600, 800]),
])
def test_malformed_collection(api, payload):
    client, state, _, _ = api
    state["payload"] = payload
    response = client.post("/api/v1/isochrone", json={"location": LOCATION})
    assert response.status_code == 502


@pytest.mark.parametrize("mutation", ["missing_value", "string_value", "negative_value", "wrong_type",
    "open_ring", "short_ring", "empty_polygon", "invalid_coordinate", "degenerate_ring"])
def test_malformed_feature(api, mutation):
    client, state, _, _ = api
    feature = state["payload"]["features"][0]
    geometry = feature["geometry"]
    if mutation == "missing_value":
        del feature["properties"]["value"]
    elif mutation == "string_value":
        feature["properties"]["value"] = "300"
    elif mutation == "negative_value":
        feature["properties"]["value"] = -300
    elif mutation == "wrong_type":
        geometry["type"] = "LineString"
    elif mutation == "open_ring":
        geometry["coordinates"][0][-1] = [106.84, -6.20]
    elif mutation == "short_ring":
        geometry["coordinates"] = [RING[:3]]
    elif mutation == "empty_polygon":
        geometry["coordinates"] = []
    elif mutation == "invalid_coordinate":
        geometry["coordinates"][0][1] = [0, 91]
    else:
        geometry["coordinates"] = [[LOCATION] * 4]
    assert client.post("/api/v1/isochrone", json={"location": LOCATION}).status_code == 502
