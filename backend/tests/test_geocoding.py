from copy import deepcopy

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.api.routing import get_routing_client
from app.core.config import Settings
from app.main import create_app

PAYLOAD = {"type": "FeatureCollection", "features": [{
    "type": "Feature", "geometry": {"type": "Point", "coordinates": [106.8, -6.2]},
    "properties": {"label": "Palmerah, Jakarta", "layer": "address"},
}]}


@pytest.fixture
def api():
    state = {"payload": deepcopy(PAYLOAD), "status": 200, "error": None}
    calls = []
    settings = Settings(_env_file=None, ors_api_key="test-secret")

    def handler(request):
        calls.append(request)
        if state["error"]:
            raise state["error"]("test-secret", request=request)
        return httpx.Response(state["status"], json=state["payload"])

    with httpx.Client(transport=httpx.MockTransport(handler)) as upstream:
        app = create_app(settings)
        app.dependency_overrides[get_routing_client] = lambda: upstream
        with TestClient(app) as client:
            yield client, state, calls, settings


def test_geocoding_contract(api):
    client, _, calls, _ = api
    response = client.get("/api/v1/geocoding/autocomplete", params={"q": "  Palmerah  "})
    assert response.status_code == 200
    assert response.json() == {"locations": [{"label": "Palmerah, Jakarta", "coordinates": [106.8, -6.2], "type": "address"}]}
    assert calls[0].url.path == "/geocode/autocomplete"
    assert calls[0].url.params["text"] == "Palmerah"
    assert calls[0].url.params["boundary.country"] == "IDN"
    assert calls[0].headers["Authorization"] == "test-secret"
    assert "test-secret" not in str(calls[0].url)


@pytest.mark.parametrize("query", ["", "  ", "ab", "x" * 201])
def test_invalid_query(api, query):
    client, _, calls, _ = api
    assert client.get("/api/v1/geocoding/autocomplete", params={"q": query}).status_code == 422
    assert not calls


def test_empty_results(api):
    client, state, _, _ = api
    state["payload"]["features"] = []
    assert client.get("/api/v1/geocoding/autocomplete?q=unknown").json() == {"locations": []}


def test_missing_key(api):
    client, _, calls, settings = api
    settings.ors_api_key = SecretStr("")
    assert client.get("/api/v1/geocoding/autocomplete?q=Palmerah").status_code == 503
    assert not calls


@pytest.mark.parametrize("status", [301, 401, 403, 429, 500])
def test_http_error(api, status):
    client, state, _, _ = api
    state.update(status=status, payload={"error": "test-secret"})
    response = client.get("/api/v1/geocoding/autocomplete?q=Palmerah")
    assert response.status_code == 502
    assert "test-secret" not in response.text


@pytest.mark.parametrize("error,status", [(httpx.ReadTimeout, 504), (httpx.ConnectError, 502)])
def test_network_error(api, error, status):
    client, state, _, _ = api
    state["error"] = error
    assert client.get("/api/v1/geocoding/autocomplete?q=Palmerah").status_code == status


@pytest.mark.parametrize("payload", [None, {}, [], {"error": "secret"},
    {"type": "FeatureCollection", "features": None},
    {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "LineString"}}]},
])
def test_malformed_response(api, payload):
    client, state, _, _ = api
    state["payload"] = payload
    assert client.get("/api/v1/geocoding/autocomplete?q=Palmerah").status_code == 502


def test_invalid_coordinates(api):
    client, state, _, _ = api
    state["payload"]["features"][0]["geometry"]["coordinates"] = [0, 91]
    assert client.get("/api/v1/geocoding/autocomplete?q=Palmerah").status_code == 502
