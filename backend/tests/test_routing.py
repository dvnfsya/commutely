from copy import deepcopy
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.routing import get_routing_client
from app.core.config import Settings
from app.main import create_app
from app.schemas.routing import RoutingRequest

REQUEST = {"origin": [106.8226, -6.2021], "destination": [106.83, -6.19]}
ORS_RESPONSE = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {"summary": {"distance": 1500.5, "duration": 1200}},
        "geometry": {"type": "LineString", "coordinates": [REQUEST["origin"], REQUEST["destination"]]},
    }],
    "metadata": {"private": "not returned"},
}


@pytest.fixture
def routing_client():
    calls = []
    state = {"response": ORS_RESPONSE, "status": 200, "key": "test-only-secret", "error": None}

    def handler(request):
        calls.append(request)
        if state["error"]:
            raise state["error"]("test-only-secret", request=request)
        if isinstance(state["response"], bytes):
            return httpx.Response(state["status"], content=state["response"])
        return httpx.Response(state["status"], json=state["response"])

    settings = Settings(_env_file=None, ors_api_key=state["key"])
    app = create_app(settings)
    with httpx.Client(transport=httpx.MockTransport(handler)) as upstream:
        app.dependency_overrides[get_routing_client] = lambda: upstream
        with TestClient(app) as client:
            yield client, calls, state, settings


def test_success_and_coordinate_order(routing_client):
    client, calls, _, _ = routing_client
    response = client.post("/api/v1/routing", json=REQUEST)
    assert response.status_code == 200
    assert response.json() == {
        "distance_m": 1500.5, "duration_s": 1200,
        "geometry": ORS_RESPONSE["features"][0]["geometry"],
    }
    assert str(calls[0].url) == "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"
    assert calls[0].headers["Authorization"] == "test-only-secret"
    assert json.loads(calls[0].content)["coordinates"] == [REQUEST["origin"], REQUEST["destination"]]
    assert json.loads(calls[0].content)["units"] == "m"
    assert RoutingRequest(**REQUEST).profile == "foot-walking"


@pytest.mark.parametrize("changes", [
    {"origin": [-6.2, 106.8]}, {"origin": [181, 0]}, {"destination": [0, -91]},
    {"origin": [1]}, {"origin": [1, 2, 3]}, {"origin": [True, 0]},
    {"origin": ["106.8", 0]}, {"origin": None}, {"profile": "driving-car"},
    {"profile": "../../other"}, {"alternatives": True},
])
def test_request_validation(routing_client, changes):
    client, calls, _, _ = routing_client
    assert client.post("/api/v1/routing", json={**REQUEST, **changes}).status_code == 422
    assert not calls


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_nonfinite_coordinates(value):
    with pytest.raises(ValidationError):
        RoutingRequest(origin=[value, 0], destination=[0, 0])


def test_missing_key(routing_client):
    client, calls, _, settings = routing_client
    from pydantic import SecretStr
    settings.ors_api_key = SecretStr("")
    response = client.post("/api/v1/routing", json=REQUEST)
    assert response.status_code == 503
    assert response.json() == {"detail": "Routing service is not configured."}
    assert not calls


@pytest.mark.parametrize("status", [301, 400, 401, 403, 429, 500, 503])
def test_http_failures_are_sanitized(routing_client, status):
    client, _, state, _ = routing_client
    state.update(status=status, response={"error": "test-only-secret"})
    response = client.post("/api/v1/routing", json=REQUEST)
    assert response.status_code == 502
    assert "test-only-secret" not in response.text


@pytest.mark.parametrize("error,status", [(httpx.ReadTimeout, 504), (httpx.ConnectTimeout, 504), (httpx.ConnectError, 502)])
def test_transport_failures(routing_client, error, status):
    client, _, state, _ = routing_client
    state["error"] = error
    response = client.post("/api/v1/routing", json=REQUEST)
    assert response.status_code == status
    assert "test-only-secret" not in response.text


@pytest.mark.parametrize("payload", [b"not json", None, [], {}, {"error": "private"}, {"type": "FeatureCollection", "features": []}])
def test_malformed_envelope(routing_client, payload):
    client, _, state, _ = routing_client
    state["response"] = payload
    assert client.post("/api/v1/routing", json=REQUEST).status_code == 502


@pytest.mark.parametrize("field,value", [
    ("distance", -1), ("duration", "invalid"), ("duration", None),
    ("geometry", {"type": "Point", "coordinates": [0, 0]}),
    ("geometry", {"type": "LineString", "coordinates": [[0, 0]]}),
    ("geometry", {"type": "LineString", "coordinates": [[0, 91], [0, 0]]}),
])
def test_malformed_route(routing_client, field, value):
    client, _, state, _ = routing_client
    payload = deepcopy(ORS_RESPONSE)
    feature = payload["features"][0]
    if field == "geometry":
        feature[field] = value
    else:
        feature["properties"]["summary"][field] = value
    state["response"] = payload
    assert client.post("/api/v1/routing", json=REQUEST).status_code == 502


def test_routing_cors(routing_client):
    client, calls, _, _ = routing_client
    response = client.options("/api/v1/routing", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert not calls
