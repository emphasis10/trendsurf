#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/deploy/compose/docker-compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Error: Docker Compose file not found at $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Warning: $ENV_FILE not found. Services may rely on environment variables defined there." >&2
fi

exec docker compose -f "$COMPOSE_FILE" up "$@"
