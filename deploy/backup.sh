#!/usr/bin/env bash
# Noćni bekap Learn365 baze (Postgres u kontejneru learn365-db). Cron kao korisnik `deploy`:
#   15 3 * * * /srv/learn365/backup.sh >> /srv/learn365/backups/backup.log 2>&1
# Radi: pg_dump -Fc u /srv/learn365/backups/learn365-YYYY-MM-DD.dump, briše dumpove starije od KEEP_DAYS.
# Ne dira ništa od Računa. Vraćanje iz dumpa: docs/DEPLOY.md §10.
set -euo pipefail
R=/srv/learn365
DIR="$R/backups"
KEEP_DAYS=14
CONTAINER=learn365-db

mkdir -p "$DIR"
OUT="$DIR/learn365-$(date +%F).dump"
TMP="$OUT.part"

docker exec "$CONTAINER" pg_dump -U learn365 -d learn365 -Fc > "$TMP"
mv "$TMP" "$OUT"
find "$DIR" -name 'learn365-*.dump' -mtime +"$KEEP_DAYS" -delete

echo "$(date -Is) backup ok: $OUT ($(du -h "$OUT" | cut -f1)); disk $(df -h / | awk 'NR==2 {print $4}') slobodno"
