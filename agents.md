# AGENTS.md — TrendSurf

> A codex‑cli agent spec for a web tool that lets researchers track topic‑specific paper trends, auto‑summarize, and score novelty. Targets Docker Compose deployment with Ollama + OpenAI‑compatible LLMs and a single system‑wide embedding model.

---

## 0) Project Snapshot

**Codename:** `trendsurf`  
**Goal:** Researchers log in, see a topic feed of the latest papers (e.g., from arXiv), open a detail page with metadata, TL;DR, AI analysis summary, and a **novelty score (0–10)**.  
**LLM providers:**
- **Generation (user‑selectable):** Ollama local endpoints **and** OpenAI‑compatible APIs (e.g., OpenAI, Together, Groq, etc.).
- **Embeddings (system‑wide, not user‑selectable):** One embedding model configured globally.

**Deploy:** Docker Compose (dev & prod).  
**Persistence:** Postgres (+pgvector) or Qdrant for vector search; Redis for queues & caching; MinIO (optional) for artifacts.  
**Ingestion:** arXiv (primary), extensible to Crossref/Semantic Scholar/Papers with Code.

---

## 1) High‑Level Architecture

```
┌───────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│  Web Frontend     │◄────►│  REST/GraphQL API │◄────►│  Auth (JWT/OAuth2)  │
└────────┬──────────┘      └────────┬──────────┘      └─────────┬──────────┘
         │                            │                           │
         ▼                            ▼                           │
   ┌───────────────┐        ┌──────────────────────┐              │
   │ Topic Matcher │◄──────►│  Vector DB (pgvector │              │
   └──────┬────────┘        │  or Qdrant)         │              │
          │                 └─────────┬───────────┘              │
          ▼                           ▼                          │
   ┌──────────────┐          ┌─────────────────┐                 │
   │  Summarizer  │◄────────►│  LLM Providers  │◄────────────────┘
   └──────┬───────┘          └─────────────────┘
          │
          ▼
   ┌──────────────┐   cron/queue   ┌─────────────────┐   fetch   ┌─────────┐
   │ NoveltyScore │◄──────────────►│  Worker Orchestr│◄──────────│ arXiv   │
   └──────────────┘                 └─────────────────┘           └─────────┘
```

---

## 2) Data Model (Outline)

> Use **Postgres for relational metadata** and **Qdrant for all vectors** (decided).

### Tables

- **users**: `id`, `email`, `name`, `password_hash` (or external OAuth id), `role`, `llm_pref` (provider+model for gen), timestamps.
- **topics**: `id`, `user_id`, `name`, `description`, `filters_json` (e.g., arXiv categories + keywords), timestamps.
- **papers**: `id`, `source` (e.g., "arxiv"), `source_id`, `title`, `authors[]`, `abstract`, `published_at`, `updated_at`, `url_pdf`, `url_page`, `primary_category`, `meta_json`.
- **paper_vectors** *(Qdrant collection)*: vector(s) for papers; payload: `paper_id`, `model_name`, `dim`, `created_at`.  
- **topic_vectors** *(Qdrant collection)*: anchor vectors per topic with payload `topic_id`, etc.
- **analyses**: `id`, `paper_id`, `tldr`, `ai_summary`, `novelty_score` (0–10), `provider` (ollama/openai‑compat), `gen_model`, `embed_model`, `tokens`, `latency_ms`, `status`, `error`, timestamps.
- **topic_matches**: `topic_id`, `paper_id`, `score`, `reason`, `created_at` (denormalized table powering feeds).
- **settings**: `key`, `value_json`, `scope` ("system" | "user:{id}") — store system‑wide embedding model here.
- **jobs**: audit of scheduled/adhoc jobs and their last run state.

### Indexes

- `papers(source, source_id)` unique.  
- Vector search handled by **Qdrant** (HNSW; optional PQ/quantization).  
- `topic_matches(topic_id, score DESC, created_at DESC)`.

---

## 3) Providers & Environment

### Provider Abstraction

- **Generation providers** (user‑selectable per account):
  - `OLLAMA`: `OLLAMA_BASE_URL`, `OLLAMA_GEN_MODEL` (default), `OLLAMA_TIMEOUT`.
  - `OPENAI_COMPAT`: `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_GEN_MODEL` (default).
- **Embeddings (system‑wide):** One of:
  - `EMBED_PROVIDER=openai_compat|ollama`
  - `EMBED_BASE_URL`, `EMBED_API_KEY` (if needed), `EMBED_MODEL`

### Required Env (Compose)

- Postgres: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`  
- Redis: none required by default  
- API: `JWT_SECRET`, `CORS_ORIGIN`, provider variables above  
- Worker: same provider variables + DB/Redis URLs  
- **Qdrant**: `QDRANT_URL`, `QDRANT_API_KEY` (if set), `QDRANT_COLLECTION_PAPERS`, `QDRANT_COLLECTION_TOPICS`  
- Frontend: `NEXT_PUBLIC_API_BASE_URL` (or VITE_…)

> **Policy:** Embedding model is set in **system scope** (not user‑changeable). Generation model & provider are **per‑user** in profile settings.

---

## 4) Ingestion & Matching Flow

1) **Fetch candidates** (cron): call arXiv API per topic filter set (categories, date ranges, keywords).  
2) **Deduplicate** against `papers(source, source_id)`; upsert metadata.  
3) **Parse PDF full text** using **GROBID** (Phase 1 default); store normalized text (and optional TEI). Fallback to abstract when PDF unavailable.  
4) **Embed** abstracts/**or** parsed full text with the **system embedding model**; write vectors to **Qdrant** collections.  
4) **Match** paper vectors to each user topic anchor vector:
   - Topic anchor vector = embedding of topic **description + keywords**.
   - Compute cosine similarity; threshold + top‑k.
   - Write `topic_matches` with score & reason (e.g., top keywords matched).
5) **Queue analysis** for newly matched papers:
   - **TL;DR** prompt → short bullet form.
   - **AI analysis** prompt → structured, sectioned summary (method, results, limitations).
   - **Novelty score** prompt + algorithmic score blending (see §6).
6) **Persist** to `analyses`; update feed caches.

**Extensibility:** Add Crossref, Semantic Scholar, PWC fetchers behind a common `PaperSource` interface.

---

## 5) Frontend UX (MVP)

- **Auth:** email+password (JWT) or OAuth (GitHub/Google).  
- **Dashboard:** per‑topic tabs, infinite list (title, authors, date, badges: `TL;DR`, `Novelty 7.8/10`).  
- **Paper detail page:**
  - Metadata + links (PDF, source page)
  - TL;DR
  - AI Analysis (method, contributions, results, limitations)
  - **Novelty score** with breakdown (semantic distance vs. corpus, claim uniqueness, citation overlap) and caution note.
- **Settings:** choose **LLM provider/model** for generation; view (readonly) the system embedding model.
- **Topic manager:** create/edit topics; preview matched sample papers.

---

## 6) Novelty Score (0–10)

**Hybrid approach = Heuristic + LLM critique**

**Algorithmic (0–7 pts):**
- **Semantic distance (0–3):** 1 − max cosine similarity vs. last 12‑month corpus within the same category (higher distance → higher novelty).  
- **Keyword delta (0–2):** BM25/KeyBERT vs. topic centroid; reward emergent terms absent from prior top‑n keyword sets.  
- **Citation overlap (0–2):** (optional if references parsed) Jaccard dissimilarity vs. recent cluster citations.

**LLM Critique (0–3 pts):**
- Prompt a model to rate **original contribution**, **risk of incrementalism**, **evidence of new method/data/theory**. Use a rubric; extract a 0–3 score and a short rationale.  

**Validation:** show confidence band (`low/med/high`) depending on text availability (abstract‑only vs PDF parsed) and model agreement.

---

## 7) Prompts (System)

> Place these in `/prompts` and refer to by id. Providers must be interchangeable.

**`tldr.v1`**  
Instruction: “Write a 3–5 bullet TL;DR of the paper for an ML researcher. Be specific. Avoid hype.”  
Output JSON:
```json
{"bullets": ["...", "..."]}
```

**`analysis.v1`**  
Instruction: “Summarize method, data, results, limitations, and likely impact. Keep to ~150–250 words. Use neutral tone.”  
Output JSON:
```json
{"method":"...","data":"...","results":"...","limitations":"...","impact":"..."}
```

**`novelty_critic.v1`**  
Instruction: “Given abstract and (optional) context, score originality 0–3 with a 1–2 sentence rationale.”  
Output JSON:
```json
{"score": 0, "rationale": "..."}
```

---

## 8) Agents (codex‑cli)

> Each agent has: **intent**, **inputs**, **outputs**, **tools**, **run conditions**, and **success criteria**. Codex commands should chain these agents.

### A) `fetcher.arxiv`
- **Intent:** Pull new papers per topic filter.  
- **Input:** `topic.filters_json`  
- **Output:** `papers` upserts  
- **Tools:** `http`, `rateLimiter`, `json`  
- **Success:** New/updated `papers` rows; `jobs` log updated.

### B) `parser.pdf`
- **Intent:** Retrieve and extract text from PDF (if available).  
- **Input:** `papers.url_pdf`  
- **Output:** normalized text blob stored in `paper_text` (optional table)  
- **Tools:** `**GROBID** container (primary), `pdfminer.six` fallback  
- **Success:** Extracted text or fallback to abstract.

### C) `embedder.system`
- **Intent:** Produce embeddings for papers and topic anchors.  
- **Input:** text; `EMBED_*` env  
- **Output:** vectors in `paper_embeddings`  
- **Tools:** `embedClient` (supports ollama/openai‑compat)  
- **Success:** vectors present; dim/model match settings.

### D) `matcher.topic`
- **Intent:** Rank papers per topic.  
- **Input:** paper vectors; topic anchor vectors  
- **Output:** `topic_matches`  
- **Tools:** `vectorSearch`  
- **Success:** new matches with scores & reasons.

### E) `summarizer.llm`
- **Intent:** Generate TL;DR and analysis.  
- **Input:** abstract/full text; user’s **generation** provider/model  
- **Output:** `analyses.tldr`, `analyses.ai_summary`  
- **Tools:** `genClient` (provider‑aware)  
- **Success:** JSON conformant to prompt schema.

### F) `novelty.scorer`
- **Intent:** Compute hybrid novelty score.  
- **Input:** embeddings, corpus stats, `novelty_critic.v1`  
- **Output:** `analyses.novelty_score` + rationale  
- **Tools:** `stats`, `genClient`  
- **Success:** 0–10 score stored; rationale audit saved.

### G) `notifier.digest`
- **Intent:** Send email/Slack daily digest per user/topic.  
- **Input:** top matches in last 24h  
- **Output:** rendered HTML/markdown digest  
- **Tools:** SMTP/Webhook  
- **Success:** Delivered notification (optional for MVP).

### H) `admin.reindex`
- **Intent:** Recompute embeddings or switch embedding model.  
- **Input:** model name  
- **Output:** refreshed vectors  
- **Tools:** `embedClient`, `migrations`

---

## 9) Workflows (codex‑cli tasks)

> Suggested task names and dependencies. Replace with your codex‑cli syntax.

1. **`cron:ingest`** (hourly):
   - run `fetcher.arxiv` per topic → `parser.pdf` (async fan‑out) → `embedder.system` → `matcher.topic` → enqueue `summarizer.llm` and `novelty.scorer` for new matches.

2. **`onpaper:analyze`** (event):
   - Triggered when a paper is matched to any topic.

3. **`daily:digest`**:
   - Gather per user/topic, render digest, send (optional).

4. **`admin:reindex`**:
   - Pause matchers → recompute embeddings → resume.

**Retry/Backoff:** Exponential per agent; idempotent via `(source, source_id)` and `(paper_id, topic_id)` keys.

---

## 10) API Contracts (sketch)

- `POST /auth/register` / `POST /auth/login` → JWT  
- `GET /me` / `PATCH /me` (fields: `llm_provider`, `llm_model`)  
- `GET /topics` / `POST /topics` / `PATCH /topics/:id` / `DELETE /topics/:id`  
- `GET /feed?topic_id=…&cursor=…` → `{ items: [{paper, analysis, match_score}], nextCursor }`  
- `GET /papers/:id` → `{ paper, analysis, related: [...] }`  
- `GET /settings/embedding` → `{ model: "text-embedding‑…", provider: "…" }`

**Provider Config:**
- User updates `llm_provider` (`ollama` | `openai_compat`) + `llm_model` (string).  
- Server validates against allowlist.

---

## 11) Docker Compose Topology (non‑code)

Services:
- `api` (FastAPI/Node)  
- `worker` (RQ/Celery/Arq)  
- `frontend` (Next.js/Vite)  
- `postgres`  
- `redis`  
- `ollama` (optional local LLM/embedding)  
- `qdrant`  
- `minio` (optional artifacts)

Networks/Volumes defined for data durability. Healthchecks for API/DB/VectorStore.

---

## 12) Security & Privacy

- Store API keys server‑side; never expose embedding provider key to clients.  
- JWT short‑lived; refresh tokens (httpOnly).  
- Encrypt secrets at rest; TLS in prod.  
- PII minimization: email + name only.  
- Rate limit per user & per IP.  
- Access control: user can only see their topics and matches.

---

## 13) Quality Gates

- **Prompt JSON validation**: reject & retry until valid; log raw outputs.  
- **Deterministic unit tests** for scoring pipeline using fixed embeddings.  
- **Eval set**: 50 known papers across 5 topics; assert ranking sanity vs. handcrafted labels.  
- **Latency SLOs**: TL;DR < 6s avg (OpenAI‑compat), < 12s (Ollama local) on M‑class model.

---

## 14) Decisions (confirmed)

1) **Embedding store:** **Qdrant** for vectors; Postgres for metadata.  
2) **PDF parsing (Phase 1):** **GROBID enabled from MVP** (full‑text + references) with `pdfminer.six` fallback.  
3) **User‑level quotas:** **None** (unlimited; ops may clamp via env).  
4) **Digest notifications:** **Excluded** from MVP.  
5) **Frontend:** **Next.js**.

---

## 15) Acceptance Criteria (MVP)

- Users can register/login and set **their generation model** (Ollama or OpenAI‑compat).  
- System‑wide embedding model configured once; visible (read‑only) in Settings.  
- Topics can be created with category/keyword filters.  
- Dashboard shows a **ranked list** of new papers per topic with TL;DR, analysis snippet, novelty score badge.  
- Paper detail shows full analysis + links.  
- Ingestion runs on a schedule and is idempotent.

---

## 16) codex‑cli Mapping (examples)

> Replace with your actual codex‑cli syntax; this is a semantic mapping.

```yaml
agents:
  fetcher.arxiv:
    intent: "fetch latest papers for topics"
    inputs: [topic.filters_json]
    outputs: [papers]
    tools: [http, json, rateLimiter]

  parser.pdf:
    intent: "extract text from PDFs"
    tools: [pdfminer|grobid]

  embedder.system:
    intent: "create embeddings (system‑wide model)"
    env: [EMBED_PROVIDER, EMBED_BASE_URL, EMBED_API_KEY, EMBED_MODEL]

  matcher.topic:
    intent: "rank candidate papers for each topic"

  summarizer.llm:
    intent: "generate TL;DR and analysis"
    env: [LLM_PROVIDER, OLLAMA_BASE_URL, OPENAI_BASE_URL, OPENAI_API_KEY]

  novelty.scorer:
    intent: "hybrid novelty score"

  notifier.digest:
    optional: true

workflows:
  cron:ingest:
    steps: [fetcher.arxiv, parser.pdf, embedder.system, matcher.topic, summarizer.llm, novelty.scorer]
    schedule: hourly

  daily:digest:
    steps: [notifier.digest]
    schedule: daily@09:00 Asia/Seoul
```

---

## 17) Risks & Mitigations

- **Rate limits / blocking** → rotate queries, cache, respect arXiv terms.  
- **LLM JSON drift** → use response formatters + schema validation w/ retries.  
- **Embedding drift on model switch** → version embeddings; keep dual‑index during migration.  
- **Hallucinated novelty** → keep heuristic backbone; show rationale + confidence.

---

## 18) Next Docs (to author after sign‑off)

- `IMPLEMENTATION_PLAN.md` (service scaffolds, endpoints, DB migrations)  
- `docker-compose.yml` (prod & dev)  
- `SCHEMAS.sql` / `schemas/` (SQL + ORM models)  
- `PROMPTS/README.md` (prompt ids and change log)  
- `TEST_PLAN.md` (unit/e2e/eval)  
- `PROVIDERS.md` (Ollama & OpenAI‑compat clients)

---

**End of AGENTS.md**

