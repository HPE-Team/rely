#!/usr/bin/env bash
# Push local slides to EC2 and restart the server cleanly.
# All connected clients will reconnect on next refresh with consistent JS chunks.
# Usage: ./deploy/push.sh

set -e

KEY="$HOME/.ssh/rely-slides.pem"
HOST="ubuntu@13.207.45.93"
REMOTE_DIR="/opt/rely/slides"

echo "→ syncing files..."
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .vercel \
  -e "ssh -i $KEY" \
  "$(dirname "$0")/../" "$HOST:$REMOTE_DIR/"

echo "→ restarting slidev..."
ssh -i "$KEY" "$HOST" "sudo systemctl restart slidev"

echo "→ waiting for server..."
sleep 10
ssh -i "$KEY" "$HOST" 'bash -s' <<'REMOTE'
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3030/ 2>/dev/null)
  [ "$code" = "200" ] && { echo "✓ live"; exit 0; }
  sleep 2
done
echo "⚠ not responding after 50s"
journalctl -u slidev --no-pager -n 10
exit 1
REMOTE
