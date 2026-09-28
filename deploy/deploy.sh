#!/usr/bin/env bash
# Deploy nove slike Learn365 na VPS-u. Zove ga GitHub Actions kroz ssh kao korisnik `deploy`,
# posle zelenog CI-ja na main (Faza 10):
#   bash /srv/learn365/deploy.sh sha-xxxxxxxxxxxx
# Radi: zapamti prethodni IMAGE_TAG, upiše novi u .env, povuče sliku, podigne samo `web`, sačeka
# healthcheck iz slike. Ako web ne postane healthy, VRATI prethodni tag, ponovo podigne web i sačeka
# (Faza 12) — pokvarena slika nikad ne ostaje da radi. Briše starije learn365-web tagove osim novog,
# prethodnog i latest (samo ovaj repo slike — ništa globalno, ništa od Računa).
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

# Ispisuje krajnji status healthchecka; 0 samo ako je `healthy` u roku od ~60 s.
wait_healthy() {
  local status=none
  local i
  for i in $(seq 1 30); do
    status=$(docker inspect -f '{{.State.Health.Status}}' learn365-web 2>/dev/null || echo none)
    if [ "$status" = healthy ]; then
      echo healthy
      return 0
    fi
    sleep 2
  done
  echo "$status"
  return 1
}

set_tag "$TAG"
"$DC" pull --quiet web
"$DC" up -d web

if status=$(wait_healthy); then
  :
else
  echo "web nije healthy ($status) na $TAG; poslednji logovi:"
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
fi

# Čuvamo novi, prethodni i latest da sledeći rollback bude trenutan.
keep=(-e ":$TAG\$" -e ':latest$' -e ':<none>$')
if [ -n "$PREV" ]; then
  keep+=(-e ":$PREV\$")
fi
docker images "$IMG" --format '{{.Repository}}:{{.Tag}}' \
  | grep -v "${keep[@]}" \
  | xargs -r docker rmi >/dev/null 2>&1 || true

echo "deploy ok: $IMG:$TAG (prethodni: ${PREV:-none}); disk $(df -h / | awk 'NR==2 {print $4}') slobodno"
