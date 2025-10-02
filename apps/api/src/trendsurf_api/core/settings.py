from functools import lru_cache
from typing import Any

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  """Application settings loaded from environment variables."""

  app_name: str = "TrendSurf API"
  environment: str = "development"
  database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/trendsurf"
  redis_url: str = "redis://localhost:6379/0"
  jwt_secret: str = "change-me"
  cors_origin: str = "http://localhost:3000"

  llm_allowlist: str = ""
  ollama_base_url: AnyHttpUrl | None = None
  ollama_timeout: float = 120.0
  openai_base_url: AnyHttpUrl | None = None
  openai_api_key: str | None = None
  openai_timeout: float = 60.0

  arxiv_delay_ms: int = 3200
  arxiv_max_results_per_run: int = 40
  pdf_max_mb: int = 40
  user_agent: str = "TrendSurfBot/0.1"

  qdrant_url: AnyHttpUrl | None = None
  qdrant_api_key: str | None = None
  qdrant_collection_papers: str = "paper_vectors"
  qdrant_collection_topics: str = "topic_vectors"

  grobid_url: AnyHttpUrl | None = None
  grobid_timeout: float = 60.0

  embed_provider: str | None = None
  embed_base_url: AnyHttpUrl | None = None
  embed_api_key: str | None = None
  embed_model: str | None = None
  embed_dimensions: int = 1536

  model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

  @field_validator(
    "ollama_base_url",
    "openai_base_url",
    "qdrant_url",
    "grobid_url",
    "embed_base_url",
    mode="before",
  )
  @classmethod
  def empty_string_to_none(cls, value: Any) -> Any:
    """Normalize blank env values to None so optional URLs stay optional."""
    if isinstance(value, str) and value.strip() == "":
      return None
    return value

  @property
  def cors_origins(self) -> list[str]:
    origins_raw = self.cors_origin
    if not origins_raw:
      return []
    return [origin.strip() for origin in origins_raw.split(",") if origin.strip()]

  @property
  def allowed_llm_models(self) -> dict[str, list[str]]:
    pairs: dict[str, list[str]] = {}
    if not self.llm_allowlist:
      return pairs
    for entry in self.llm_allowlist.split(","):
      if ":" not in entry:
        continue
      provider, model = entry.split(":", 1)
      provider = provider.strip()
      model = model.strip()
      if not provider or not model:
        continue
      pairs.setdefault(provider, []).append(model)
    return pairs


@lru_cache(maxsize=1)
def get_settings(**overrides: Any) -> Settings:
  return Settings(**overrides)
