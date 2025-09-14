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

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_prisma()
    yield
    await close_prisma()

app = FastAPI(title="PTS Manager API", version="0.1.0", lifespan=lifespan)

"""CORS configuration

Rules:
1. If CORS_ALLOW_ORIGINS env var is absent or '*', allow all origins WITHOUT credentials (fast, permissive dev mode).
2. If specific origins provided (comma separated), use them and enable credentials.
3. Expose the effective configuration via /api/_debug/cors for runtime inspection.
"""
origins_env = os.getenv("CORS_ALLOW_ORIGINS", "*").strip()
raw_origins = [o.strip() for o in origins_env.split(",") if o.strip()] if origins_env != "*" else ["*"]

# If wildcard we cannot legally send Access-Control-Allow-Credentials: true; so only enable credentials when explicit list.
explicit_origins = origins_env != "*"
allow_credentials = explicit_origins
allow_origins = raw_origins if explicit_origins else ["*"]

# Allow common headers; wildcard sometimes blocked with certain proxies when combined with credentials.
allow_headers = [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "X-Requested-With",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=allow_headers,
)

# Store for debug endpoint
_cors_config = {
    "allow_origins": allow_origins,
    "allow_credentials": allow_credentials,
    "allow_methods": ["*"],
    "allow_headers": allow_headers,
}

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
