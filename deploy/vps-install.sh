#!/usr/bin/env bash
# Prvo podešavanje Learn365 na VPS-u (root, jednom). Idempotentno.
#   scp deploy/vps-install.sh ~/.ssh/learn365_deploy.pub root@<IP>:/root/  →  ssh root@<IP> bash /root/vps-install.sh
# Radi SAMO ovo:
#   - korisnik `deploy` (bez lozinke, u grupi docker) sa SSH ključem iz /root/learn365_deploy.pub
#   - folderi /srv/learn365 (vlasnik deploy) i /srv/learn365/cloudflared (65532 = nonroot u cloudflared slici)
# Ne dira: ufw, Docker daemon, sshd, cron, /srv/racuni ni bilo šta od Računa. Docker već postoji (Računi).
set -euo pipefail
PUB=/root/learn365_deploy.pub
command -v docker >/dev/null || { echo "GRESKA: docker nije instaliran"; exit 1; }
[ -s "$PUB" ] || { echo "GRESKA: nema $PUB (javni ključ za korisnika deploy)"; exit 1; }

echo "== korisnik deploy"
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy "$PUB" /home/deploy/.ssh/authorized_keys
# ključ iz GitHub Actions sme TAČNO jednu komandu (deploy.sh sa sha- tagom — Faza 14, ssh-command.sh) i nikakav
# forwarding ni pty. ssh-command.sh se kopira zajedno sa ostalim deploy/ fajlovima (DEPLOY.md §3b, korak 3).
sed -i 's#^\(ssh-\)#command="/srv/learn365/ssh-command.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding \1#' /home/deploy/.ssh/authorized_keys

echo "== folderi"
install -d -m 755 -o deploy -g deploy /srv/learn365
install -d -m 750 -o 65532 -g 65532 /srv/learn365/cloudflared
[ -f /srv/learn365/.env ] || { echo 'IMAGE_TAG=latest' > /srv/learn365/.env; chown deploy:deploy /srv/learn365/.env; }

echo "== gotovo: RAM slobodno $(free -h | awk '/Mem:/ {print $7}'), disk slobodno $(df -h / | awk 'NR==2 {print $4}')"
echo "   racuni kontejneri (netaknuti): $(docker ps --filter name=racuni --format '{{.Names}}={{.Status}}' | tr '\n' ' ')"
