#!/bin/zsh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "Starting Options Projection Dashboard..."
echo "Project: $PROJECT_DIR"
echo

echo "Checking server/.env..."
if [ ! -f "$PROJECT_DIR/server/.env" ]; then
  echo "Missing server/.env. Please create it with Alpaca credentials first."
  echo
  read "?Press Enter to close..."
  exit 1
fi

PATH_PREFIX="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/share/pnpm:$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback"
export PATH="$PATH_PREFIX:$PATH"

resolve_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    command -v pnpm
    return 0
  fi

  local candidate
  for candidate in \
    "/opt/homebrew/bin/pnpm" \
    "/usr/local/bin/pnpm" \
    "$HOME/.local/share/pnpm/pnpm" \
    "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm"; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

PNPM_BIN="$(resolve_pnpm || true)"
if [ -z "$PNPM_BIN" ]; then
  echo "pnpm is not installed. Install pnpm first."
  echo
  read "?Press Enter to close..."
  exit 1
fi
echo "Using pnpm: $PNPM_BIN"

echo "Forcing frontend .env to Backend/Alpaca mode..."
cat > "$PROJECT_DIR/.env" <<'ENVEOF'
VITE_DATA_PROVIDER=backend
VITE_API_BASE_URL=http://localhost:4000
ENVEOF

find_frontend_port() {
  local port
  for port in 5173 5174 5175 5176 5177; do
    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$port"
      return 0
    fi
  done

  echo "5173"
}

FRONTEND_PORT="$(find_frontend_port)"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

echo "Starting backend on port 4000..."
echo "Starting frontend on Vite port ${FRONTEND_PORT}..."
echo "Opening browser..."
echo
echo "Dashboard should show:"
echo "Data Provider: Backend"
echo "Market: Real / Alpaca"
echo "Options: Mock"
echo

/usr/bin/osascript - "$PROJECT_DIR" "$FRONTEND_PORT" "$PNPM_BIN" "$PATH_PREFIX" <<'APPLESCRIPT'
on run argv
  set projectDir to item 1 of argv
  set frontendPort to item 2 of argv
  set pnpmBin to item 3 of argv
  set pathPrefix to item 4 of argv
  set backendCommand to "cd " & quoted form of projectDir & " && export PATH=" & quoted form of pathPrefix & " && echo 'Starting backend on port 4000...' && " & quoted form of pnpmBin & " run dev:backend"
  set frontendCommand to "cd " & quoted form of projectDir & " && export PATH=" & quoted form of pathPrefix & " && echo 'Starting frontend on Vite...' && VITE_DATA_PROVIDER=backend VITE_API_BASE_URL=http://localhost:4000 " & quoted form of pnpmBin & " run dev -- --host 127.0.0.1 --port " & frontendPort

  tell application "Terminal"
    do script backendCommand
    do script frontendCommand
    activate
  end tell
end run
APPLESCRIPT

echo "Waiting for frontend at $FRONTEND_URL ..."
for attempt in {1..60}; do
  if curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
    open "$FRONTEND_URL"
    echo "Opening browser at $FRONTEND_URL"
    echo "Keep the backend and frontend Terminal windows open while using the dashboard."
    echo
    read "?Press Enter to close this launcher window..."
    exit 0
  fi
  sleep 1
done

echo "Frontend did not respond at $FRONTEND_URL."
echo "Check the frontend Terminal window for errors, then open the URL manually."
echo
read "?Press Enter to close this launcher window..."
