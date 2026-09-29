#!/usr/bin/env bash
# Deploy nove slike Learn365 na VPS-u. Zove ga GitHub Actions kroz ssh kao korisnik `deploy`,
# posle zelenog CI-ja na main (Faza 10):
#   bash /srv/learn365/deploy.sh sha-xxxxxxxxxxxx
# Radi: zapamti prethodni IMAGE_TAG, upiše novi u .env, povuče sliku, podigne samo `web`, sačeka
# healthcheck iz slike, pa (ako postoji baza) da /api/health kaže da migracije nisu `pending`. Ako web
# ne postane healthy ili migracije ne prođu, VRATI prethodni tag, ponovo podigne web i sačeka
# (Faza 12, review 2026-09-30) — pokvarena slika nikad ne ostaje da radi. Briše starije learn365-web
# tagove osim novog, prethodnog i latest (samo ovaj repo slike — ništa globalno, ništa od Računa).
set -euo pipefail
R=/srv/learn365
TAG="${1:?tag slike, npr. sha-1a2b3c4d5e6f}"
IMG=ghcr.io/pavlekukric/learn365-web
DC="$R/dc.sh"

PREV=$(grep '^IMAGE_TAG=' "$R/.env" 2>/dev/null | head -1 | cut -d= -f2- || true)

set_tag() {
  if grep -q '^IMAGE_TAG=' "$R/.env" 2>/dev/null; then
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$1/" "$R/.env"
  else
    echo "IMAGE_TAG=$1" >> "$R/.env"
  fi
}

# Ispisuje krajnji status healthchecka; 0 samo ako je `healthy` u roku od HEALTH_WAIT sekundi.
# Healthcheck iz slike (apps/web/Dockerfile): interval 15 s, start-period 45 s, retries 3 — Docker
# proglasi `unhealthy` najranije posle ~90–105 s, pa 150 s ostavlja rezervu za spor hladan start na
# 512 MB kutiji (review 2026-09-30, stavka 10). `unhealthy` je Dockerova presuda: ne čekamo dalje.
HEALTH_WAIT=150
wait_healthy() {
  local status=none
  local i
  for i in $(seq 1 $((HEALTH_WAIT / 2))); do
    status=$(docker inspect -f '{{.State.Health.Status}}' learn365-web 2>/dev/null || echo none)
    if [ "$status" = healthy ]; then
      echo healthy
      return 0
    fi
    if [ "$status" = unhealthy ]; then
      break
    fi
    sleep 2
  done
  echo "$status"
  return 1
}

# Stanje migracija iz /api/health (off | pending | ok | failed), pitano iznutra kontejnera — isti
# `node -e fetch` kao healthcheck, bez curl-a u slici. `legacy` = slika starija od polja `migrations`
# (ručni rollback na stari tag, §6) — prihvata se; `unknown` ako ruta ne odgovori.
migrations_state() {
  docker exec learn365-web node -e "fetch('http://127.0.0.1:3000/api/health').then((r) => r.json()).then((b) => console.log(b.migrations ?? (b.db ? 'legacy' : 'unknown'))).catch(() => console.log('unknown'))" 2>/dev/null || echo unknown
}

# Posle `healthy`: ako je baza podešena, čeka da migracije ne budu `pending` (najviše MIGRATIONS_WAIT
# sekundi). 0 za `ok`, `off` (nema baze → nema naloga) ili `legacy`; 1 za `failed` ili isteklo čekanje
# (npr. baza nedostupna celo vreme — deploy se tada ne primenjuje, prethodni tag ostaje).
MIGRATIONS_WAIT=120
wait_migrations() {
  local state=unknown
  local i
  for i in $(seq 1 $((MIGRATIONS_WAIT / 3))); do
    state=$(migrations_state)
    case "$state" in
      ok | off | legacy)
        echo "$state"
        return 0
        ;;
      failed)
        break
        ;;
    esac
    sleep 3
  done
  echo "$state"
  return 1
}

# Vraća prethodni tag, podigne web i čeka healthy; uvek završava sa exit 1 (deploy nije primenjen).
rollback() {
  echo "$1; poslednji logovi:"
  "$DC" logs --tail 40 web
  if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
    echo "vraćam prethodni tag $PREV"
    set_tag "$PREV"
    "$DC" up -d web
    if back=$(wait_healthy); then
      echo "rollback ok: web je healthy na $PREV; $TAG nije primenjen"
    else
      echo "rollback NIJE uspeo: web je $back na $PREV — ručna intervencija (docs/DEPLOY.md §6)"
    fi
  else
    echo "nema prethodnog taga za rollback"
  fi
  exit 1
}

set_tag "$TAG"
"$DC" pull --quiet web
"$DC" up -d web

if ! status=$(wait_healthy); then
  rollback "web nije healthy ($status) na $TAG"
fi

if ! migrations=$(wait_migrations); then
  rollback "migracije nisu primenjene na $TAG (/api/health: migrations=$migrations)"
fi
echo "web healthy na $TAG; migracije: $migrations"

# Čuvamo novi, prethodni i latest da sledeći rollback bude trenutan.
keep=(-e ":$TAG\$" -e ':latest$' -e ':<none>$')
if [ -n "$PREV" ]; then
  keep+=(-e ":$PREV\$")
fi
docker images "$IMG" --format '{{.Repository}}:{{.Tag}}' \
  | grep -v "${keep[@]}" \
  | xargs -r docker rmi >/dev/null 2>&1 || true

echo "deploy ok: $IMG:$TAG (prethodni: ${PREV:-none}); disk $(df -h / | awk 'NR==2 {print $4}') slobodno"
