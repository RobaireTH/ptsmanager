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

# CORS: allow all (development convenience). Set CORS_ALLOW_ORIGINS to restrict in prod.
origins_env = os.getenv("CORS_ALLOW_ORIGINS", "*")
allow_origins = ["*"] if origins_env.strip() == "*" else [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/health")
async def health():
    return {"status": "ok"}
