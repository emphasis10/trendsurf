from __future__ import annotations

from ..core.settings import get_settings
from .gen_client import ModelNotAllowedError
from .types import GenerationProvider


def validate_generation_choice(provider: str, model: str) -> None:
  """Ensure a user-selected provider/model pair is allowed by the system allowlist."""
  settings = get_settings()
  try:
    enum_provider = GenerationProvider(provider)
  except ValueError as exc:
    raise ModelNotAllowedError(f"Unknown generation provider: {provider}") from exc

  allowlist = settings.allowed_llm_models
  if not allowlist:
    return

  allowed_models = allowlist.get(enum_provider.value)
  if allowed_models is None or model not in allowed_models:
    raise ModelNotAllowedError(
      f"Model {model} is not permitted for provider {enum_provider.value}"
    )
