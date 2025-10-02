from __future__ import annotations

from typing import Any

import httpx

from ..core.settings import get_settings
from .types import CompletionResult, GenerationProvider


class ModelNotAllowedError(RuntimeError):
  pass


async def generate_text(
  provider: GenerationProvider,
  *,
  model: str,
  prompt: str,
  system: str | None = None,
  temperature: float = 0.7,
  max_tokens: int | None = None,
  timeout: float | None = None,
  extra: dict[str, Any] | None = None,
) -> CompletionResult:
  settings = get_settings()
  _ensure_model_allowed(provider, model, settings.allowed_llm_models)

  extra = extra or {}

  if provider == GenerationProvider.OLLAMA:
    base_url = extra.get("base_url")
    if not base_url and settings.ollama_base_url:
      base_url = str(settings.ollama_base_url)
    if not base_url:
      raise RuntimeError(
        "OLLAMA_BASE_URL is not configured. Set it in the environment or supply a base_url override."
      )
    timeout = timeout or settings.ollama_timeout
    payload: dict[str, Any] = {
      "model": model,
      "prompt": prompt,
      "stream": False,
      "options": {
        "temperature": temperature,
      },
    }
    if system:
      payload["system"] = system
    if max_tokens is not None:
      payload["options"]["num_predict"] = max_tokens

    async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
      response = await client.post("/api/generate", json=payload)
      response.raise_for_status()
      data = response.json()
      return CompletionResult(
        content=data.get("response", ""),
        model=data.get("model", model),
        provider=provider.value,
        prompt_tokens=data.get("prompt_eval_count"),
        completion_tokens=data.get("eval_count"),
      )

  if provider == GenerationProvider.OPENAI_COMPAT:
    base_url = extra.get("base_url") or (str(settings.openai_base_url) if settings.openai_base_url else "https://api.openai.com/v1")
    api_key = extra.get("api_key") or settings.openai_api_key
    timeout = timeout or settings.openai_timeout
    headers = {
      "Content-Type": "application/json",
    }
    if api_key:
      headers["Authorization"] = f"Bearer {api_key}"

    body: dict[str, Any] = {
      "model": model,
      "messages": _build_chat_messages(prompt, system),
      "temperature": temperature,
    }
    if max_tokens is not None:
      body["max_tokens"] = max_tokens

    async with httpx.AsyncClient(timeout=timeout) as client:
      response = await client.post(f"{base_url}/chat/completions", headers=headers, json=body)
      response.raise_for_status()
      data = response.json()
      choice = data["choices"][0]
      message = choice["message"]["content"]
      usage = data.get("usage", {})
      return CompletionResult(
        content=message,
        model=data.get("model", model),
        provider=provider.value,
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
      )

  raise NotImplementedError(f"Unsupported provider: {provider}")


def _ensure_model_allowed(
  provider: GenerationProvider, model: str, allowlist: dict[str, list[str]]
) -> None:
  if not allowlist:
    return
  allowed_models = allowlist.get(provider.value)
  if allowed_models is None:
    raise ModelNotAllowedError(f"Provider {provider.value} is not allowed")
  if model not in allowed_models:
    raise ModelNotAllowedError(f"Model {model} is not in allowlist for provider {provider.value}")


def _build_chat_messages(prompt: str, system: str | None) -> list[dict[str, str]]:
  messages: list[dict[str, str]] = []
  if system:
    messages.append({"role": "system", "content": system})
  messages.append({"role": "user", "content": prompt})
  return messages
