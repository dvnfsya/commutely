from copy import deepcopy
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError

from app.api.assistant import get_gemini_client
from app.core.config import Settings
from app.main import create_app
from app.schemas.assistant import AssistantRequest
from app.services.gemini import SYSTEM_INSTRUCTION

REQUEST = {"question": "Bagaimana kondisi rute ini?", "context": {
    "station": "Sudirman", "safety_score": 72, "lighting": "cukup",
    "police_nearby": True, "retail_24h": 3, "details": {"unknown": None},
}}
RESPONSE = {"candidates": [{"finishReason": "STOP", "content": {"parts": [
    {"text": "Data yang tersedia belum cukup untuk memastikan keamanan rute."}
]}}]}


@pytest.fixture
def api():
    state = {"payload": deepcopy(RESPONSE), "status": 200, "error": None}
    calls = []
    settings = Settings(_env_file=None, gemini_api_key="test-only-secret", gemini_model="gemini-test-model")

    def handler(request):
        calls.append(request)
        if state["error"]:
            raise state["error"]("test-only-secret", request=request)
        if isinstance(state["payload"], bytes):
            return httpx.Response(state["status"], content=state["payload"])
        return httpx.Response(state["status"], json=state["payload"])

    app = create_app(settings)
    with httpx.Client(transport=httpx.MockTransport(handler)) as upstream:
        app.dependency_overrides[get_gemini_client] = lambda: upstream
        with TestClient(app) as client:
            yield client, state, calls, settings


def test_success_and_controlled_prompt(api):
    client, _, calls, _ = api
    response = client.post("/api/v1/assistant", json=REQUEST)
    assert response.status_code == 200
    assert response.json() == {"answer": RESPONSE["candidates"][0]["content"]["parts"][0]["text"]}
    assert len(calls) == 1
    assert str(calls[0].url) == "https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent"
    assert calls[0].headers["x-goog-api-key"] == "test-only-secret"
    body = json.loads(calls[0].content)
    assert body["systemInstruction"]["parts"][0]["text"] == SYSTEM_INSTRUCTION
    assert json.loads(body["contents"][0]["parts"][0]["text"]) == REQUEST
    assert "test-only-secret" not in calls[0].content.decode()
    assert "tools" not in body
    assert "Do not calculate Safety Score" in SYSTEM_INSTRUCTION
    assert "insufficient" in SYSTEM_INSTRUCTION


@pytest.mark.parametrize("changes", [
    {"question": ""}, {"question": "   "}, {"question": None}, {"question": 1},
    {"question": "x" * 2001}, {"context": []}, {"context": "not an object"},
    {"context": None}, {"context": {"large": "x" * 16001}}, {"tools": []},
])
def test_request_validation(api, changes):
    client, _, calls, _ = api
    assert client.post("/api/v1/assistant", json={**REQUEST, **changes}).status_code == 422
    assert not calls


def test_empty_context_and_question_trimming(api):
    client, _, calls, _ = api
    assert client.post("/api/v1/assistant", json={"question": "  Halo  ", "context": {}}).status_code == 200
    prompt = json.loads(json.loads(calls[0].content)["contents"][0]["parts"][0]["text"])
    assert prompt == {"question": "Halo", "context": {}}


@pytest.mark.parametrize("value", [float("nan"), float("inf")])
def test_context_rejects_nonfinite(value):
    with pytest.raises(ValidationError):
        AssistantRequest(question="Question", context={"value": value})


def test_missing_key(api):
    client, _, calls, settings = api
    settings.gemini_api_key = SecretStr("")
    response = client.post("/api/v1/assistant", json=REQUEST)
    assert response.status_code == 503
    assert response.json() == {"detail": "Assistant service is not configured."}
    assert not calls


@pytest.mark.parametrize("status", [301, 400, 401, 403, 429, 500, 503])
def test_http_failure_sanitized(api, status, caplog):
    client, state, _, _ = api
    state.update(status=status, payload={"error": "test-only-secret"})
    response = client.post("/api/v1/assistant", json=REQUEST)
    assert response.status_code == 502
    assert "test-only-secret" not in response.text + caplog.text
    assert REQUEST["question"] not in caplog.text


@pytest.mark.parametrize("error,status", [(httpx.ReadTimeout, 504), (httpx.ConnectTimeout, 504), (httpx.ConnectError, 502)])
def test_transport_failure(api, error, status):
    client, state, _, _ = api
    state["error"] = error
    response = client.post("/api/v1/assistant", json=REQUEST)
    assert response.status_code == status
    assert "test-only-secret" not in response.text


@pytest.mark.parametrize("payload", [None, [], {}, b"not json", {"candidates": []},
    {"error": "test-only-secret"}, {"promptFeedback": {"blockReason": "SAFETY"}},
    {"candidates": [{"content": {"parts": []}}]},
])
def test_malformed_envelope(api, payload):
    client, state, _, _ = api
    state["payload"] = payload
    assert client.post("/api/v1/assistant", json=REQUEST).status_code == 502


@pytest.mark.parametrize("text", ["", "  ", None, 42, "x" * 8001, "test-only-secret"])
def test_empty_or_invalid_answer(api, text):
    client, state, _, _ = api
    state["payload"]["candidates"][0]["content"]["parts"] = [{"text": text}]
    assert client.post("/api/v1/assistant", json=REQUEST).status_code == 502


@pytest.mark.parametrize("reason", ["SAFETY", "MAX_TOKENS", "RECITATION"])
def test_incomplete_or_blocked_answer(api, reason):
    client, state, _, _ = api
    state["payload"]["candidates"][0]["finishReason"] = reason
    assert client.post("/api/v1/assistant", json=REQUEST).status_code == 502


def test_thoughts_not_returned_and_text_parts_joined(api):
    client, state, _, _ = api
    state["payload"]["candidates"][0]["content"]["parts"] = [
        {"text": "private thoughts", "thought": True}, {"text": "Data "}, {"text": "kurang."},
    ]
    assert client.post("/api/v1/assistant", json=REQUEST).json() == {"answer": "Data kurang."}


def test_environment_configuration(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-secret")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-test-model")
    settings = Settings(_env_file=None)
    assert settings.gemini_model == "gemini-test-model"
    assert "test-only-secret" not in repr(settings)


def test_model_path_validation():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, gemini_model="../unexpected?key=secret")
