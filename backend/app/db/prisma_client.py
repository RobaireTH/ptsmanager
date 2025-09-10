from prisma import Prisma

prisma = Prisma()

async def init_prisma():
    if not prisma.is_connected():
        await prisma.connect()

async def close_prisma():
    if prisma.is_connected():
        await prisma.disconnect()
