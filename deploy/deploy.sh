#!/usr/bin/env bash
# Deploy nove slike Learn365 na VPS-u. Zove ga GitHub Actions kroz ssh kao korisnik `deploy`:
#   bash /srv/learn365/deploy.sh sha-xxxxxxxxxxxx
# Radi: upiše IMAGE_TAG u .env, povuče sliku, podigne samo `web`, sačeka healthcheck iz slike,
# obriše starije learn365-web tagove (samo ovaj repo slike — ništa globalno, ništa od Računa).
set -euo pipefail
R=/srv/learn365
TAG="${1:?tag slike, npr. sha-1a2b3c4d5e6f}"
IMG=ghcr.io/pavlekukric/learn365-web
DC="$R/dc.sh"

if grep -q '^IMAGE_TAG=' "$R/.env" 2>/dev/null; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$TAG/" "$R/.env"
else
  echo "IMAGE_TAG=$TAG" >> "$R/.env"
fi

"$DC" pull --quiet web
"$DC" up -d web

status=none
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' learn365-web 2>/dev/null || echo none)
  [ "$status" = healthy ] && break
  sleep 2
done
if [ "$status" != healthy ]; then
  echo "web nije healthy ($status); poslednji logovi:"
  "$DC" logs --tail 40 web
  exit 1
fi

docker images "$IMG" --format '{{.Repository}}:{{.Tag}}' \
  | grep -v -e ":$TAG\$" -e ':latest$' -e ':<none>$' \
  | xargs -r docker rmi >/dev/null 2>&1 || true

echo "deploy ok: $IMG:$TAG; disk $(df -h / | awk 'NR==2 {print $4}') slobodno"
