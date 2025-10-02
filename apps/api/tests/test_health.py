from fastapi.testclient import TestClient

from trendsurf_api.main import app


def test_healthcheck() -> None:
  client = TestClient(app)
  response = client.get("/healthz")
  assert response.status_code == 200
  assert response.json() == {"status": "ok"}
