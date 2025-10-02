from __future__ import annotations

from typing import Iterable, Sequence

import httpx

from ..core.settings import get_settings
from .types import EmbeddingProvider


class EmbeddingError(RuntimeError):
  pass


async def embed_texts(
  texts: Sequence[str],
  *,
  model: str | None = None,
  provider: EmbeddingProvider | None = None,
  timeout: float | None = None,
) -> list[list[float]]:
  if not texts:
    return []

  settings = get_settings()
  provider = provider or _infer_provider(settings)
  model = model or settings.embed_model
  if not model:
    raise EmbeddingError("Embedding model is not configured")

  if provider == EmbeddingProvider.OLLAMA:
    base_url: str | None = None
    if settings.embed_base_url:
      base_url = str(settings.embed_base_url)
    elif settings.ollama_base_url:
      base_url = str(settings.ollama_base_url)
    if not base_url:
      raise EmbeddingError(
        "EMBED_BASE_URL or OLLAMA_BASE_URL must be configured for Ollama embeddings"
      )
    payload = {"model": model, "input": list(texts)}
    timeout = timeout or settings.ollama_timeout
    async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
      response = await client.post("/api/embeddings", json=payload)
      response.raise_for_status()
      data = response.json()
      return [item["embedding"] for item in data.get("data", [])]

  if provider == EmbeddingProvider.OPENAI_COMPAT:
    base_url = str(settings.embed_base_url or settings.openai_base_url or "https://api.openai.com/v1")
    api_key = settings.embed_api_key or settings.openai_api_key
    headers = {"Content-Type": "application/json"}
    if api_key:
      headers["Authorization"] = f"Bearer {api_key}"
    payload = {"model": model, "input": list(texts)}
    timeout = timeout or settings.openai_timeout
    async with httpx.AsyncClient(timeout=timeout) as client:
      response = await client.post(f"{base_url}/embeddings", headers=headers, json=payload)
      response.raise_for_status()
      data = response.json()
      return [item["embedding"] for item in data.get("data", [])]

  raise EmbeddingError(f"Unsupported embedding provider: {provider}")


def _infer_provider(settings) -> EmbeddingProvider:
  provider = settings.embed_provider
  if not provider:
    raise EmbeddingError("EMBED_PROVIDER is not configured")
  try:
    return EmbeddingProvider(provider)
  except ValueError as exc:
    raise EmbeddingError(f"Unknown embedding provider: {provider}") from exc
