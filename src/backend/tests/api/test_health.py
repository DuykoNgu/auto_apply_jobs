from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from host.main import app
from shared.database import get_session


class FakeSession:
    def __init__(self, failing: bool) -> None:
        self.failing = failing

    def execute(self, _: object) -> None:
        if self.failing:
            raise OperationalError("SELECT 1", None, Exception("down"))


def client_with(failing: bool) -> TestClient:
    app.dependency_overrides[get_session] = lambda: FakeSession(failing)
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_overrides() -> Iterator[None]:
    yield
    app.dependency_overrides.clear()


def test_health_ok() -> None:
    response = client_with(failing=False).get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_degraded_when_database_down() -> None:
    response = client_with(failing=True).get("/api/v1/health")
    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "database": "down"}


def test_unknown_route_is_404() -> None:
    assert client_with(failing=False).get("/api/v1/nope").status_code == 404


def test_swagger_ui_is_served() -> None:
    client = client_with(failing=False)
    assert client.get("/api/v1/docs").status_code == 200
    assert "/api/v1/health" in client.get("/api/v1/openapi.json").json()["paths"]
