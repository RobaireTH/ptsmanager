from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.api import auth, websockets, attendance
from app.api import classes_prisma as classes
from app.api import events_prisma as events
from app.api import users_prisma as users
from app.api import messages_prisma as messages
from app.api import parents_prisma as parents
from app.api import teachers_prisma as teachers
from app.api import students_prisma as students
from app.api import results_prisma as results
from app.db.prisma_client import init_prisma, close_prisma
from prisma import Prisma
import pathlib, time

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_prisma()
    yield
    await close_prisma()

app = FastAPI(title="PTS Manager API", version="0.1.0", lifespan=lifespan)

"""Simplified * wildcard CORS (no credentials) as requested.
NOTE: With wildcard we cannot use cookies or Authorization-based credential reflection.
If you later need credentials, revert to explicit origin list.
"""
allow_origins = ["*"]
allow_credentials = False
allow_headers = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=allow_headers,
)

# Store for debug endpoint
_cors_config = {"allow_origins": allow_origins, "allow_credentials": allow_credentials, "allow_methods": ["*"], "allow_headers": allow_headers}

# Optional CORS debug logging (prints per-request details when DEBUG_CORS=1)
if os.getenv("DEBUG_CORS", "0") in ("1", "true", "yes"):
    @app.middleware("http")
    async def _cors_debug_logger(request, call_next):
        origin = request.headers.get("origin")
        method = request.method
        path = request.url.path
        # Preflight detection
        if method == "OPTIONS":
            print(f"[CORS DEBUG] Preflight OPTIONS from {origin} to {path}")
        else:
            print(f"[CORS DEBUG] {method} {path} Origin={origin}")
        response = await call_next(request)
        if origin:
            acao = response.headers.get("access-control-allow-origin")
            acac = response.headers.get("access-control-allow-credentials")
            if not acao:
                print(f"[CORS DEBUG] Origin {origin} NOT allowed (configured: {allow_origins})")
            else:
                print(f"[CORS DEBUG] Response CORS headers: A-C-A-Origin={acao} A-C-A-Credentials={acac}")
        return response

# Routers
app.include_router(auth.router, prefix="/api")
# (Compatibility) also expose auth without /api prefix in case frontend hits /auth/* directly
app.include_router(auth.router)
app.include_router(users.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(parents.router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(websockets.router, prefix="/api")

@app.get("/api/_debug/routes")
async def list_routes():
    """Return list of registered routes (method -> path) for debugging 404 issues."""
    return sorted([
        {"path": r.path, "methods": sorted(list(r.methods))}
        for r in app.routes
    ], key=lambda x: x["path"])

@app.get("/api/_debug/cors")
async def cors_config():
    """Return effective CORS configuration."""
    return _cors_config

@app.get("/api/_debug/db")
async def db_debug():
    # Derive path from DATABASE_URL env (sqlite only) else prisma default
    db_url = os.getenv("DATABASE_URL", "file:./ptsmanager.db")
    path_part = db_url.split("file:",1)[1] if db_url.startswith("file:") else db_url
    p = pathlib.Path(path_part)
    exists = p.exists()
    size = p.stat().st_size if exists else 0
    mtime = p.stat().st_mtime if exists else None
    prisma_client = Prisma()
    try:
        if not prisma_client.is_connected():
            await prisma_client.connect()
        user_count = await prisma_client.user.count()
    except Exception:
        user_count = None
    finally:
        if prisma_client.is_connected():
            await prisma_client.disconnect()
    return {
        "database_url": db_url,
        "resolved_path": str(p.resolve()),
        "exists": exists,
        "size_bytes": size,
        "modified": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime)) if mtime else None,
        "user_count": user_count,
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    """Root endpoint returning 200 so upstream probes don't get 404."""
    return {
        "service": "PTS Manager API",
        "status": "ok",
        "health": "/health",
        "api_base": "/api",
        "version": "0.1.0"
    }
