# TrendSurf

TrendSurf lets researchers track topic-specific paper trends with AI-powered summaries, novelty scoring, and vector-based matching. This repository follows the architecture and plan defined in `AGENTS.md` and `IMPLEMENTATION_PLAN.md`.

## Structure

```
apps/
  api/        # FastAPI backend
  frontend/   # Next.js frontend
  worker/     # Background tasks
deploy/
  compose/    # Docker Compose topology
prompts/      # Prompt definitions for summarization and novelty scoring
scripts/      # Utility scripts
```

## Getting Started

1. Duplicate `.env.sample` to `.env` and update provider credentials and secrets.
2. Use the compose file in `deploy/compose/docker-compose.yml` to bootstrap the stack (see implementation plan milestones for sequencing).
3. Expand each service following `IMPLEMENTATION_PLAN.md` tasks (T2 onwards).
