#!/usr/bin/env bash
# Noćni bekap Learn365 baze (Postgres u kontejneru learn365-db). Cron kao korisnik `deploy`:
#   15 3 * * * /srv/learn365/backup.sh >> /srv/learn365/backups/backup.log 2>&1
# Radi: pg_dump -Fc u /srv/learn365/backups/learn365-YYYY-MM-DD.dump (fajl vidi samo `deploy`,
# umask 077), proveri da pg_restore ume da izlista sadržaj dumpa (Faza 12), zadrži tačno KEEP
# najnovijih dumpova (po imenu = po datumu). Ne dira ništa od Računa. Vraćanje iz dumpa i proba
# vraćanja: docs/DEPLOY.md §10.
# Kopija van servera (review 2026-09-30, stavka 10) — SAMO ako je u /srv/learn365/.env podešeno
#   BACKUP_OFFBOX_TARGET=rclone:<remote>:<putanja>      (rclone, remote u ~/.config/rclone/rclone.conf)
#   BACKUP_OFFBOX_TARGET=rsync:<korisnik>@<host>:<putanja>  (rsync preko ssh-a, ključ korisnika deploy)
# kopira današnji dump tamo (ništa ne briše na odredištu). Prazno ili bez linije = preskače se.
set -euo pipefail
umask 077
R=/srv/learn365
DIR="$R/backups"
KEEP=14
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

# Tačno KEEP najnovijih: imena nose datum (YYYY-MM-DD), pa je obrnut sort po imenu = od najnovijeg.
# (Ranije `find -mtime +14`, što je zbog zaokruživanja na cele dane čuvalo 15–16 dumpova.)
find "$DIR" -maxdepth 1 -name 'learn365-*.dump' -printf '%f\n' \
  | sort -r \
  | tail -n +$((KEEP + 1)) \
  | while read -r old; do rm -f -- "${DIR:?}/$old"; done

echo "$(date -Is) backup ok: $OUT ($(du -h "$OUT" | cut -f1), $ENTRIES unosa); disk $(df -h / | awk 'NR==2 {print $4}') slobodno"

# Kopija van servera: samo linija iz .env (ne učitava se ceo .env — u njemu su tajne za druge servise).
TARGET="${BACKUP_OFFBOX_TARGET:-$(grep '^BACKUP_OFFBOX_TARGET=' "$R/.env" 2>/dev/null | head -1 | cut -d= -f2- || true)}"
if [ -z "$TARGET" ]; then
  exit 0
fi
case "$TARGET" in
  rclone:*)
    DEST="${TARGET#rclone:}"
    if ! command -v rclone >/dev/null 2>&1; then
      echo "$(date -Is) offbox NEUSPEH: rclone nije instaliran (BACKUP_OFFBOX_TARGET=$TARGET)"
      exit 1
    fi
    if ! rclone copy --quiet "$OUT" "$DEST"; then
      echo "$(date -Is) offbox NEUSPEH: rclone copy $OUT → $DEST"
      exit 1
    fi
    ;;
  rsync:*)
    DEST="${TARGET#rsync:}"
    if ! rsync -a --chmod=F600 -e 'ssh -o BatchMode=yes -o ConnectTimeout=20' "$OUT" "$DEST/"; then
      echo "$(date -Is) offbox NEUSPEH: rsync $OUT → $DEST"
      exit 1
    fi
    ;;
  *)
    echo "$(date -Is) offbox NEUSPEH: BACKUP_OFFBOX_TARGET mora početi sa rclone: ili rsync: (dobio: $TARGET)"
    exit 1
    ;;
esac
echo "$(date -Is) offbox ok: $(basename "$OUT") → $DEST"
