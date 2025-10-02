# TrendSurf To-Do

## M1 Ingestion & Parsing
- [ ] Persist arXiv query results into SQLAlchemy models with idempotent upserts and topic linkage (`apps/api/src/trendsurf_api/ingestion/arxiv_client.py:1`, `apps/api/src/trendsurf_api/models/tables.py:1`).
- [ ] Orchestrate topic-driven ingest that downloads PDFs, stores `PaperFulltext`, and records job state for reruns (`apps/api/src/trendsurf_api/ingestion/pdf_fetcher.py:1`, `apps/api/src/trendsurf_api/tasks/__init__.py:1`).
- [ ] Surface ingest triggers (cron endpoint or admin API) and wire them to RQ tasks with rate limiting against arXiv (`apps/worker/src/trendsurf_worker/main.py:1`).

## M2 Embedding & Matching
- [ ] Implement embedding pipeline that chunks normalized text, calls `embed_texts`, and upserts vectors plus payload metadata into Qdrant (`apps/api/src/trendsurf_api/providers/embed_client.py:1`, `apps/api/src/trendsurf_api/vectors/client.py:1`).
- [ ] Generate and maintain topic anchor vectors, including bootstrap routines and refresh paths (`apps/api/src/trendsurf_api/vectors/bootstrap.py:1`).
- [ ] Build matching logic that queries Qdrant, applies filters, computes scores, and populates `topic_matches` with rationale (`apps/api/src/trendsurf_api/matching/__init__.py:1`, `apps/api/src/trendsurf_api/models/tables.py:77`).

## M3 Analysis & Novelty
- [ ] Implement TL;DR, structured analysis, and novelty scorer modules using the prompts with JSON validation and retry/backoff (`apps/api/src/trendsurf_api/analysis/__init__.py:1`, `prompts/tldr.v1.json:1`).
- [ ] Store analysis outputs in `Analysis` records and expose confidence metadata derived from heuristic + LLM signals (`apps/api/src/trendsurf_api/models/tables.py:48`).
- [ ] Integrate analysis pipeline into the worker, batching expensive calls and handling fallbacks when PDFs fail (`apps/api/src/trendsurf_api/tasks/__init__.py:1`).

## M3 Auth, API & Services
- [ ] Build auth layer (password hashing, JWT access/refresh, request dependencies) (`apps/api/src/trendsurf_api/auth/__init__.py:1`).
- [ ] Define Pydantic schemas and service layer objects to separate DB logic from FastAPI routes (`apps/api/src/trendsurf_api/schemas/__init__.py:1`).
- [ ] Implement REST routers for topics, papers, feed, settings, and admin management, then register them in the FastAPI app (`apps/api/src/trendsurf_api/routers/__init__.py:1`, `apps/api/src/trendsurf_api/main.py:1`).
- [ ] Add configuration endpoints (generation provider/model selection, embedding read-only view) honoring allowlists (`apps/api/src/trendsurf_api/providers/validators.py:1`).

## M3 Frontend
- [ ] Create authentication pages (sign in/up, password reset) and persist tokens securely in Next.js (`apps/frontend/app/page.tsx:1`).
- [ ] Implement topic manager UI for CRUD + filter configuration and connect it to API endpoints (`apps/frontend/components`, `apps/frontend/lib`).
- [ ] Build dashboard feed, paper detail view with TL;DR/analysis/novelty, and settings page for generation provider choice and embedding display (`apps/frontend/app/layout.tsx:1`).
- [ ] Add shared data-fetching utilities with error handling, loading skeletons, and optimistic updates (`apps/frontend/lib`).

## M4 Worker Orchestration & Reliability
- [ ] Register discrete RQ jobs for ingest, parsing, embedding, analysis, and matching with retry/backoff policies and dead-letter handling (`apps/worker/src/trendsurf_worker/main.py:1`).
- [ ] Share backend code with worker via a common package or poetry extras to avoid duplication and enable unit testing (`apps/api/pyproject.toml:1`, `apps/worker/pyproject.toml:1`).
- [ ] Expose worker health/liveness endpoints and structured logging to align with observability goals (`apps/worker/src/trendsurf_worker/main.py:1`).

## M4 QA, Testing & Observability
- [ ] Expand backend unit tests for ingestion parsers, provider clients, embedding pipeline, and novelty logic plus integration tests for ingest→analysis→match flow (`apps/api/tests/test_health.py:1`).
- [ ] Add frontend component tests and Playwright smoke tests for auth, topic CRUD, feed, and paper detail (`apps/frontend/tests`).
- [ ] Introduce CI workflow (lint, tests, build) and static checks (ruff, mypy/pyright) per plan (§12, §8) (`scripts/bootstrap.sh:1`).
- [ ] Implement structured metrics/logging, FastAPI readiness endpoint, and external service probes for Qdrant/GROBID (`apps/api/src/trendsurf_api/main.py:1`).

