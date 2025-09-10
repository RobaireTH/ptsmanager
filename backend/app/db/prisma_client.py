from prisma import Prisma
import importlib
import subprocess
import sys
import os

prisma = Prisma()
_generated = False

def _ensure_generated():
    global _generated
    if _generated:
        return
    try:
        importlib.import_module('prisma.models')
        _generated = True
        return
    except ImportError:
        pass
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    cmd = [sys.executable, '-m', 'prisma', 'generate']
    try:
        print('[prisma_client] Running prisma generate...', file=sys.stderr)
        subprocess.run(cmd, check=True, cwd=backend_dir, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        importlib.invalidate_caches()
        importlib.import_module('prisma.models')  # verify
        _generated = True
        print('[prisma_client] prisma generate complete', file=sys.stderr)
    except Exception as e:
        raise RuntimeError(f"Failed to generate Prisma client. Ensure 'prisma' package installed. Original error: {e}")

async def init_prisma():
    _ensure_generated()
    if not prisma.is_connected():
        await prisma.connect()

async def close_prisma():
    if prisma.is_connected():
        await prisma.disconnect()
