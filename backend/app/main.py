from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.api import users, teachers, students, parents, classes, events, messages, auth, results
from app.db.prisma_client import init_prisma, close_prisma

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_prisma()
    yield
    await close_prisma()

app = FastAPI(title="PTS Manager API", version="0.1.0", lifespan=lifespan)

# CORS (adjust origins in production)
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
app.include_router(users.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(parents.router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
from app.api import users, teachers, students, parents, classes, events, messages, auth, results, websockets, users_prisma

# ... (rest of the file)

app.include_router(results.router, prefix="/api")
app.include_router(websockets.router, prefix="/api")
app.include_router(users_prisma.router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}
