#!/usr/bin/env bash
set -euo pipefail

# Bootstrap the TrendSurf stack: run database migrations and ensure Qdrant collections exist.
# Requires a running Postgres and Qdrant instance as configured via environment variables.

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
API_DIR="$PROJECT_ROOT/apps/api"

if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
  echo "\n[bootstrap] Missing .env file. Copy .env.sample to .env and update secrets first." >&2
  exit 1
fi

set -a
source "$PROJECT_ROOT/.env"
set +a

cd "$API_DIR"

if ! command -v poetry >/dev/null 2>&1; then
  echo "Poetry is required to run backend tasks. Install it from https://python-poetry.org/docs/." >&2
  exit 1
fi

poetry install
poetry run alembic upgrade head
poetry run python -m trendsurf_api.vectors

echo "[bootstrap] Database and Qdrant bootstrap completed."
