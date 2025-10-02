from __future__ import annotations

from enum import Enum
from typing import Literal, TypedDict


class GenerationProvider(str, Enum):
  OLLAMA = "ollama"
  OPENAI_COMPAT = "openai_compat"


class EmbeddingProvider(str, Enum):
  OLLAMA = "ollama"
  OPENAI_COMPAT = "openai_compat"


class CompletionChunk(TypedDict, total=False):
  content: str
  stop_reason: Literal["stop", "length", "tool"] | None


class CompletionResult(TypedDict):
  content: str
  model: str
  provider: str
  prompt_tokens: int | None
  completion_tokens: int | None
