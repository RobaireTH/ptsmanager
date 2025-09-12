from prisma import Prisma
import os

# Prisma database connection dependency
async def get_prisma():
    prisma = Prisma()
    await prisma.connect()
    try:
        yield prisma
    finally:
        await prisma.disconnect()
