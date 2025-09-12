from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from prisma import Prisma
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ptsmanager.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy dependency (legacy)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Prisma dependency (new)
async def get_prisma():
    prisma = Prisma()
    await prisma.connect()
    try:
        yield prisma
    finally:
        await prisma.disconnect()
