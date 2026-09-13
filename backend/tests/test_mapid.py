from copy import deepcopy
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError

from app.api.mapid import get_mapid_client
from app.core.config import Settings
from app.main import create_app

POLYGON = {"type": "Polygon", "coordinates": [[[106.7, -6.3], [107, -6.3], [107, -6.1], [106.7, -6.3]]]}
REQUEST = {"feature": POLYGON}
RESPONSE = {"success": True, "data": {"activities": [{"_id": "test-activity", "description": "pengamatan"}]},
            "meta": {"filters": {"feature": POLYGON}, "total": 1}}


@pytest.fixture
def api():
    state = {"payload": deepcopy(RESPONSE), "status": 200, "error": None}
    calls = []
    settings = Settings(_env_file=None, mapid_api_key="test-mapid-secret")

    def handler(request):
        calls.append(request)
        if state["error"]:
            raise state["error"]("test-mapid-secret", request=request)
        if isinstance(state["payload"], bytes):
            return httpx.Response(state["status"], content=state["payload"])
        return httpx.Response(state["status"], json=state["payload"])

    app = create_app(settings)
    with httpx.Client(transport=httpx.MockTransport(handler)) as upstream:
        app.dependency_overrides[get_mapid_client] = lambda: upstream
        with TestClient(app) as client:
            yield client, state, calls, settings


def test_success_and_filters(api):
    client, _, calls, _ = api
    supplied = {**REQUEST, "start_date": "2026-01-01", "end_date": "2026-01-02",
                "hashtag": ["jalan", "lampu"], "author": "pengguna"}
    response = client.post("/api/v1/mapid/activities", json=supplied)
    assert response.status_code == 200
    assert response.json() == {"activities": RESPONSE["data"]["activities"], **RESPONSE["meta"]}
    assert len(calls) == 1
    assert calls[0].method == "POST"
    assert str(calls[0].url) == "https://server.mapid.io/web/competition/activities"
    assert calls[0].headers["X-API-KEY"] == "test-mapid-secret"
    assert json.loads(calls[0].content) == supplied
    assert "test-mapid-secret" not in response.text


@pytest.mark.parametrize("count,dated,status", [(0, False, 200), (60, False, 200), (61, False, 502), (61, True, 200)])
def test_documented_record_limits(api, count, dated, status):
    client, state, calls, _ = api
    state["payload"]["data"]["activities"] = [{"_id": str(i)} for i in range(count)]
    state["payload"]["meta"]["total"] = count
    supplied = deepcopy(REQUEST)
    if dated:
        supplied.update(start_date="2026-01-01", end_date="2026-01-02")
    response = client.post("/api/v1/mapid/activities", json=supplied)
    assert response.status_code == status
    assert json.loads(calls[0].content) == supplied
    if status == 200:
        assert len(response.json()["activities"]) == count


@pytest.mark.parametrize("changes", [
    {"feature": {"type": "Point", "coordinates": [106, -6]}},
    {"feature": {"type": "Polygon", "coordinates": []}},
    {"feature": {"type": "Polygon", "coordinates": [[[106, -6], [107, -6], [106, -6]]]}},
    {"feature": {"type": "Polygon", "coordinates": [[[106, -6], [107, -6], [107, -5], [106, -5]]]}},
    {"feature": {"type": "Polygon", "coordinates": [[[181, -6], [107, -6], [107, -5], [181, -6]]]}},
    {"start_date": "2026-01-01"}, {"end_date": "2026-01-01"},
    {"start_date": "2026-02-01", "end_date": "2026-01-01"},
    {"start_date": "invalid", "end_date": "invalid"},
    {"limit": 60}, {"offset": 0}, {"hashtag": "lampu"},
])
def test_invalid_filters(api, changes):
    client, _, calls, _ = api
    assert client.post("/api/v1/mapid/activities", json={**REQUEST, **changes}).status_code == 422
    assert not calls


@pytest.mark.parametrize("payload", [None, [], {}, b"not json", {"success": False},
    {"success": True, "data": {"activities": {}}, "meta": {"filters": {}, "total": 0}},
    {"success": True, "data": {"activities": [None]}, "meta": {"filters": {}, "total": 1}},
    {"success": True, "data": {"activities": []}, "meta": {"filters": {}, "total": 1}},
])
def test_invalid_response(api, payload):
    client, state, _, _ = api
    state["payload"] = payload
    assert client.post("/api/v1/mapid/activities", json=REQUEST).status_code == 502


@pytest.mark.parametrize("status", [301, 400, 401, 403, 429, 500, 503])
def test_upstream_error(api, status):
    client, state, _, _ = api
    state.update(status=status, payload={"message": "test-mapid-secret"})
    response = client.post("/api/v1/mapid/activities", json=REQUEST)
    assert response.status_code == 502
    assert "test-mapid-secret" not in response.text


@pytest.mark.parametrize("error,status", [(httpx.ReadTimeout, 504), (httpx.ConnectTimeout, 504), (httpx.ConnectError, 502)])
def test_transport_error(api, error, status):
    client, state, _, _ = api
    state["error"] = error
    response = client.post("/api/v1/mapid/activities", json=REQUEST)
    assert response.status_code == status
    assert "test-mapid-secret" not in response.text


def test_secret_echo_rejected(api):
    client, state, _, _ = api
    state["payload"]["data"]["activities"][0]["description"] = "test-mapid-secret"
    response = client.post("/api/v1/mapid/activities", json=REQUEST)
    assert response.status_code == 502
    assert "test-mapid-secret" not in response.text


def test_missing_key(api):
    client, _, calls, settings = api
    settings.mapid_api_key = SecretStr("")
    assert client.post("/api/v1/mapid/activities", json=REQUEST).status_code == 503
    assert not calls


def test_environment_configuration(monkeypatch):
    monkeypatch.setenv("MAPID_API_KEY", "test-mapid-secret")
    monkeypatch.setenv("MAPID_ACTIVITIES_URL", "https://example.invalid/activities")
    settings = Settings(_env_file=None)
    assert str(settings.mapid_activities_url) == "https://example.invalid/activities"
    assert settings.mapid_api_key.get_secret_value() == "test-mapid-secret"
    assert "test-mapid-secret" not in repr(settings)


@pytest.mark.parametrize("url", ["http://example.invalid", "https://user:pass@example.invalid", "https://example.invalid/?key=secret"])
def test_insecure_url_rejected(url):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, mapid_activities_url=url)


@pytest.mark.parametrize("path,params,upstream,payload", [
    ("layers", {"project_id": "project & one"}, "get_layer_list", [{"layer_id": "survey", "name": "Survey"}]),
    ("layers", {"project_id": "project"}, "get_layer_list", []),
    ("layer", {"project_id": "project", "layer_id": "survey / one"}, "get_layer", {
        "type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"note": "observed", "value": None},
            "geometry": {"type": "Point", "coordinates": [106.8123456789, -6.23456789]}}],
        "metadata": {"source": "uploaded"},
    }),
    ("layer", {"project_id": "project", "layer_id": "survey"}, "get_layer", {
        "data": {"type": "FeatureCollection", "features": []}, "success": True,
    }),
])
def test_geomapid_success(api, path, params, upstream, payload):
    # Fixtures exercise pass-through shapes, not an undocumented provider schema.
    client, state, calls, _ = api
    state["payload"] = payload
    response = client.get(f"/api/v1/mapid/{path}", params=params)
    assert response.status_code == 200
    assert response.json() == payload
    assert len(calls) == 1
    assert calls[0].method == "GET"
    assert str(calls[0].url.copy_with(query=None)) == f"https://geoserver.mapid.io/layers_new/{upstream}"
    assert dict(calls[0].url.params) == {**params, "api_key": "test-mapid-secret"}
    assert "X-API-KEY" not in calls[0].headers
    assert not calls[0].content
    assert "test-mapid-secret" not in response.text


@pytest.mark.parametrize("path", ["layers", "layer"])
@pytest.mark.parametrize("status,error,expected", [
    (400, None, 502), (401, None, 502), (429, None, 502), (500, None, 502),
    (302, None, 502), (200, httpx.ReadTimeout, 504), (200, httpx.ConnectError, 502),
])
def test_geomapid_failures(api, path, status, error, expected):
    client, state, calls, _ = api
    state.update(status=status, error=error, payload={"error": "test-mapid-secret"})
    response = client.get(f"/api/v1/mapid/{path}", params={"project_id": "p", "layer_id": "l"})
    assert response.status_code == expected
    assert "test-mapid-secret" not in response.text
    assert len(calls) == 1


@pytest.mark.parametrize("path", ["layers", "layer"])
@pytest.mark.parametrize("payload", [
    None, {}, 1, "invalid", [None], b"<html>error</html>", {"success": False},
    {"data": {"properties": {"secret": "test-mapid-secret"}}},
    b'{"data":{"value":NaN}}',
])
def test_geomapid_invalid_response(api, path, payload):
    client, state, _, _ = api
    state["payload"] = payload
    response = client.get(f"/api/v1/mapid/{path}", params={"project_id": "p", "layer_id": "l"})
    assert response.status_code == 502
    assert "test-mapid-secret" not in response.text


@pytest.mark.parametrize("path,params", [
    ("layers", {}), ("layers", {"project_id": " "}),
    ("layer", {"project_id": "p"}), ("layer", {"layer_id": "l"}),
    ("layer", {"project_id": "p", "layer_id": " "}),
])
def test_geomapid_required_identifiers(api, path, params):
    client, _, calls, _ = api
    assert client.get(f"/api/v1/mapid/{path}", params=params).status_code == 422
    assert not calls


@pytest.mark.parametrize("path", ["layers", "layer"])
def test_geomapid_missing_key(api, path):
    client, _, calls, settings = api
    settings.mapid_api_key = SecretStr("")
    assert client.get(f"/api/v1/mapid/{path}", params={"project_id": "p", "layer_id": "l"}).status_code == 503
    assert not calls


def test_geomapid_url_environment(monkeypatch):
    monkeypatch.setenv("MAPID_LAYER_LIST_URL", "https://example.invalid/list")
    monkeypatch.setenv("MAPID_LAYER_URL", "https://example.invalid/layer")
    settings = Settings(_env_file=None)
    assert str(settings.mapid_layer_list_url) == "https://example.invalid/list"
    assert str(settings.mapid_layer_url) == "https://example.invalid/layer"


@pytest.mark.parametrize("field", ["mapid_layer_list_url", "mapid_layer_url"])
@pytest.mark.parametrize("url", ["http://example.invalid", "https://example.invalid/?api_key=secret"])
def test_geomapid_insecure_url(field, url):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{field: url})


@pytest.mark.parametrize("path", ["layers", "layer"])
def test_geomapid_key_query_encoding(api, path):
    client, state, calls, settings = api
    settings.mapid_api_key = SecretStr("test+key&with=reserved")
    state["payload"] = []
    response = client.get(f"/api/v1/mapid/{path}", params={"project_id": "p", "layer_id": "l"})
    assert response.status_code == 200
    assert calls[0].url.params["api_key"] == "test+key&with=reserved"
    assert len(calls[0].url.params.get_list("api_key")) == 1
    assert "with" not in calls[0].url.params
    assert "test+key" not in response.text
