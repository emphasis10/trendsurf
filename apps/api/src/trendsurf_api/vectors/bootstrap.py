from __future__ import annotations

from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from ..core.settings import get_settings
from .client import get_qdrant_client


def ensure_collections(client: QdrantClient | None = None) -> None:
  """Create required Qdrant collections if they do not already exist."""
  settings = get_settings()
  client = client or get_qdrant_client()

  collections = {
    settings.qdrant_collection_papers: _paper_collection_config(settings.embed_dimensions),
    settings.qdrant_collection_topics: _topic_collection_config(settings.embed_dimensions),
  }

  existing = {collection.name for collection in client.get_collections().collections}

  for name, config in collections.items():
    if name in existing:
      continue

    client.create_collection(
      collection_name=name,
      vectors_config=config["vectors"],
      optimizers_config=config["optimizers"],
      hnsw_config=config["hnsw"],
      quantization_config=config["quantization"],
      on_disk_payload=True,
      shard_number=2,
      payload_schema=config["payload_schema"],
    )


def _paper_collection_config(vector_size: int) -> dict[str, Any]:
  return {
    "vectors": qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
    "optimizers": qmodels.OptimizersConfigDiff(default_segment_number=2),
    "hnsw": qmodels.HnswConfigDiff(ef_construct=256, m=32),
    "quantization": None,
    "payload_schema": {
      "paper_id": qmodels.PayloadSchemaType.INTEGER,
      "model_name": qmodels.PayloadSchemaType.KEYWORD,
      "dim": qmodels.PayloadSchemaType.INTEGER,
      "created_at": qmodels.PayloadSchemaType.DATETIME,
    },
  }


def _topic_collection_config(vector_size: int) -> dict[str, Any]:
  return {
    "vectors": qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
    "optimizers": qmodels.OptimizersConfigDiff(default_segment_number=1),
    "hnsw": qmodels.HnswConfigDiff(ef_construct=128, m=24),
    "quantization": None,
    "payload_schema": {
      "topic_id": qmodels.PayloadSchemaType.INTEGER,
      "model_name": qmodels.PayloadSchemaType.KEYWORD,
      "dim": qmodels.PayloadSchemaType.INTEGER,
      "created_at": qmodels.PayloadSchemaType.DATETIME,
    },
  }
