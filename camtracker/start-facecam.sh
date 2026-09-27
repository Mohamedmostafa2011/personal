#!/usr/bin/env bash
# FaceCam - serve this folder over http://localhost so the browser grants camera access.
# (file:// does NOT work for webcams.)

set -e
cd "$(dirname "$0")"
PORT="${1:-8000}"
URL="http://localhost:$PORT/index.html"

open_browser() {
  sleep 1
  if   command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  elif command -v open     >/dev/null 2>&1; then open "$URL"
  fi
}

echo
echo "  FaceCam -> $URL"
echo "  Press Ctrl+C to stop."
echo

if command -v python3 >/dev/null 2>&1; then
  open_browser & python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  open_browser & python -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then
  open_browser & npx --yes serve -l "$PORT" .
else
  echo "  Neither Python nor Node.js found."
  echo "  Install Python 3 (https://python.org) and rerun, or use VS Code Live Server."
  exit 1
fi
