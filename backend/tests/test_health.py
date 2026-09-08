import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def client():
    settings = Settings(_env_file=None, cors_origins=["http://localhost:3000"])
    with TestClient(create_app(settings)) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize(
    ("origin", "allowed"),
    [("http://localhost:3000", True), ("https://example.com", False)],
)
def test_cors_preflight(client, origin, allowed):
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == (200 if allowed else 400)
    assert response.headers.get("access-control-allow-origin") == (
        origin if allowed else None
    )
