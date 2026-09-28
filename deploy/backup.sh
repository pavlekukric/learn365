#!/usr/bin/env bash
# Noćni bekap Learn365 baze (Postgres u kontejneru learn365-db). Cron kao korisnik `deploy`:
#   15 3 * * * /srv/learn365/backup.sh >> /srv/learn365/backups/backup.log 2>&1
# Radi: pg_dump -Fc u /srv/learn365/backups/learn365-YYYY-MM-DD.dump (fajl vidi samo `deploy`,
# umask 077), proveri da pg_restore ume da izlista sadržaj dumpa (Faza 12), briše dumpove starije
# od KEEP_DAYS. Ne dira ništa od Računa. Vraćanje iz dumpa: docs/DEPLOY.md §10.
# Kopija van servera: čeka odluku vlasnika o destinaciji (docs/DEPLOY.md §10).
set -euo pipefail
umask 077
R=/srv/learn365
DIR="$R/backups"
KEEP_DAYS=14
CONTAINER=learn365-db

mkdir -p "$DIR"
OUT="$DIR/learn365-$(date +%F).dump"
TMP="$OUT.part"

docker exec "$CONTAINER" pg_dump -U learn365 -d learn365 -Fc > "$TMP"
mv "$TMP" "$OUT"

# Provera dumpa bez baze: pg_restore --list čita arhivu sa stdin-a i ispisuje njen sadržaj;
# prazna lista znači pokvaren fajl. Broji unose oblika "NNNN; ..." (tabele, sekvence, podaci).
ENTRIES=$(docker exec -i "$CONTAINER" pg_restore --list < "$OUT" | grep -c -E '^[0-9]+; ' || true)
if [ "${ENTRIES:-0}" -lt 1 ]; then
  echo "$(date -Is) backup NEISPRAVAN: pg_restore --list ne vidi nijedan unos u $OUT"
  exit 1
fi

find "$DIR" -name 'learn365-*.dump' -mtime +"$KEEP_DAYS" -delete

echo "$(date -Is) backup ok: $OUT ($(du -h "$OUT" | cut -f1), $ENTRIES unosa); disk $(df -h / | awk 'NR==2 {print $4}') slobodno"
