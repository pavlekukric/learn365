#!/usr/bin/env bash
# Omotač oko docker compose za Learn365 na VPS-u: uvek isti compose fajl i isti .env (/srv/learn365).
# Primeri: ./dc.sh ps | ./dc.sh logs -f web | ./dc.sh up -d cloudflared | ./dc.sh restart web
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec docker compose --project-directory "$DIR" --env-file "$DIR/.env" -f "$DIR/docker-compose.yml" "$@"
