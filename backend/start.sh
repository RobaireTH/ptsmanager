#!/usr/bin/env bash
set -euo pipefail

# Resolve script directory (backend/) even if called from repo root
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment if it exists
if [[ -d .venv ]]; then
	# shellcheck disable=SC1091
	source .venv/bin/activate || echo "[start.sh] Warning: could not activate venv"
else
	echo "[start.sh] No .venv found. Create one with: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt" >&2
fi

# Ensure backend directory is on PYTHONPATH so 'app' package is importable
export PYTHONPATH="${PYTHONPATH:-}:$(pwd)"

# Generate prisma client (idempotent / fast if unchanged)
if command -v prisma >/dev/null 2>&1; then
	echo "[start.sh] Running prisma generate"
	prisma generate || echo "[start.sh] Warning: prisma generate failed"
else
	echo "[start.sh] 'prisma' CLI not found. Install with: pip install prisma" >&2
fi

PORT="${PORT:-8000}"
echo "[start.sh] Starting FastAPI on port $PORT (reload enabled)"
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
