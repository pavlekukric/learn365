#!/usr/bin/env bash
# Forsirana komanda za deploy ključ iz GitHub Actions (Faza 14, pregled P2 stavka 20).
# U /home/deploy/.ssh/authorized_keys linija tog ključa počinje sa:
#   command="/srv/learn365/ssh-command.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAA… learn365-deploy
# Dozvoljava TAČNO jedno: `bash /srv/learn365/deploy.sh sha-<12 hex>` — ono što deploy.yml šalje.
# Sve drugo (shell, drugi skript, drugi folder, Računi) se odbija. Ključ koji procuri može samo
# ponovo da izvrti ovu aplikaciju na sliku koja je već javno objavljena — i ništa više.
set -euo pipefail
cmd="${SSH_ORIGINAL_COMMAND:-}"
if [[ "$cmd" =~ ^bash\ /srv/learn365/deploy\.sh\ (sha-[0-9a-f]{12})$ ]]; then
  exec bash /srv/learn365/deploy.sh "${BASH_REMATCH[1]}"
fi
echo "odbijeno: ovaj ključ sme samo 'bash /srv/learn365/deploy.sh sha-<12 hex>' (dobio: ${cmd:-<prazno>})" >&2
exit 126
