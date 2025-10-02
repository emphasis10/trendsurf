from fastapi import FastAPI
from .core.logging import configure_logging
from .core.settings import get_settings

configure_logging()
settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
  """Simple health endpoint used by Docker healthchecks."""
  return {"status": "ok"}
