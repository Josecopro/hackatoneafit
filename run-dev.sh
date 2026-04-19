#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

load_env_file() {
  local file_path="$1"
  if [[ -f "$file_path" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "$file_path"
    set +a
  fi
}

if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
  PYTHON_CMD="$ROOT_DIR/.venv/bin/python"
elif [[ -x "$ROOT_DIR/backend/.venv/bin/python" ]]; then
  PYTHON_CMD="$ROOT_DIR/backend/.venv/bin/python"
else
  echo "[error] No se encontro un entorno Python (.venv)." >&2
  echo "[hint] Crea uno en la raiz o en backend e instala backend/requirements.txt." >&2
  exit 1
fi

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "[error] Faltan dependencias del frontend." >&2
  echo "[hint] Ejecuta: cd frontend && npm install" >&2
  exit 1
fi

load_env_file "$ROOT_DIR/.env"
load_env_file "$ROOT_DIR/.env.local"
load_env_file "$ROOT_DIR/backend/.env"
load_env_file "$ROOT_DIR/backend/.env.local"

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "[error] Faltan variables de Supabase para iniciar el backend." >&2
  echo "[hint] Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY." >&2
  echo "[hint] Puedes crear backend/.env.local a partir de backend/.env.example." >&2
  exit 1
fi

cleanup() {
  local exit_code=$?
  if [[ -n "${BACK_PID:-}" ]]; then kill "$BACK_PID" 2>/dev/null || true; fi
  if [[ -n "${FRONT_PID:-}" ]]; then kill "$FRONT_PID" 2>/dev/null || true; fi
  wait 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup INT TERM EXIT

echo "[info] Iniciando backend en :$BACKEND_PORT"
(
  cd "$ROOT_DIR/backend"
  "$PYTHON_CMD" -m uvicorn main:app --reload --port "$BACKEND_PORT"
) &
BACK_PID=$!

echo "[info] Iniciando frontend en :$FRONTEND_PORT (BACKEND_BASE_URL=http://localhost:$BACKEND_PORT)"
(
  cd "$ROOT_DIR/frontend"
  BACKEND_BASE_URL="http://localhost:$BACKEND_PORT" npm run dev -- -p "$FRONTEND_PORT"
) &
FRONT_PID=$!

wait -n "$BACK_PID" "$FRONT_PID"
