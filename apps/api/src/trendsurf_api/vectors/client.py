from __future__ import annotations

from functools import lru_cache

from qdrant_client import QdrantClient

from ..core.settings import get_settings


@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
  settings = get_settings()
  if not settings.qdrant_url:
    raise RuntimeError("QDRANT_URL is not configured")

  return QdrantClient(url=str(settings.qdrant_url), api_key=settings.qdrant_api_key)
