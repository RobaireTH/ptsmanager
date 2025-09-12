#!/usr/bin/env python3
"""
Deployment Verification Script for PTS Manager
Run this script to verify the backend is ready for production deployment
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def check_imports():
    """Test critical imports"""
    print("🔍 Checking imports...")

    try:
        # Test main app import
        from app.main import app
        print("  ✅ Main app imports successfully")

        # Test Prisma client
        from prisma import Prisma
        print("  ✅ Prisma client imports successfully")

        # Test attendance API
        from app.api import attendance
        print("  ✅ Attendance API imports successfully")

        # Test auth system
        from app.api import auth
        print("  ✅ Auth system imports successfully")

        # Test all Prisma API modules
        from app.api import classes_prisma, events_prisma, users_prisma
        from app.api import messages_prisma, parents_prisma, teachers_prisma
        from app.api import students_prisma, results_prisma
        print("  ✅ All Prisma API modules import successfully")

        return True

    except ImportError as e:
        print(f"  ❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Unexpected error: {e}")
        return False

def check_environment():
    """Check environment configuration"""
    print("🔍 Checking environment...")

    # Check if we can access environment variables
    jwt_secret = os.getenv("JWT_SECRET", "dev-secret")
    print(f"  ✅ JWT_SECRET configured: {'✓' if jwt_secret != 'dev-secret' else '⚠️  Using default'}")

    database_url = os.getenv("DATABASE_URL", "")
    if database_url:
        print(f"  ✅ DATABASE_URL configured")
    else:
        print(f"  ⚠️  DATABASE_URL not set (using default SQLite)")

    return True

async def check_prisma_connection():
    """Test Prisma database connection"""
    print("🔍 Checking Prisma connection...")

    try:
        from app.db.prisma_client import init_prisma, close_prisma

        # Initialize Prisma
        await init_prisma()
        print("  ✅ Prisma client initialized successfully")

        # Test basic connection
        from prisma import Prisma
        prisma = Prisma()
        await prisma.connect()

        # Test a simple query
        user_count = await prisma.user.count()
        print(f"  ✅ Database connection successful (found {user_count} users)")

        await prisma.disconnect()
        await close_prisma()

        return True

    except Exception as e:
        print(f"  ❌ Prisma connection error: {e}")
        return False

def check_legacy_files():
    """Check that no legacy SQLAlchemy files are active"""
    print("🔍 Checking for legacy file conflicts...")

    # Files that should NOT exist in active directories
    problematic_files = [
        "app/models/models.py",  # Should be models_legacy.py
        "app/api/classes.py",    # Should be in legacy/
        "app/api/events.py",     # Should be in legacy/
        "app/api/messages.py",   # Should be in legacy/
        "app/api/parents.py",    # Should be in legacy/
        "app/api/results.py",    # Should be in legacy/
        "app/api/students.py",   # Should be in legacy/
        "app/api/teachers.py",   # Should be in legacy/
        "app/api/users.py",      # Should be in legacy/
    ]

    conflicts = []
    for file_path in problematic_files:
        full_path = backend_dir / file_path
        if full_path.exists():
            conflicts.append(file_path)

    if conflicts:
        print("  ❌ Found conflicting legacy files:")
        for conflict in conflicts:
            print(f"    - {conflict}")
        return False
    else:
        print("  ✅ No legacy file conflicts found")
        return True

def check_required_files():
    """Check that all required files exist"""
    print("🔍 Checking required files...")

    required_files = [
        "app/main.py",
        "app/api/auth.py",
        "app/api/attendance.py",
        "app/api/websockets.py",
        "app/api/classes_prisma.py",
        "app/api/events_prisma.py",
        "app/api/messages_prisma.py",
        "app/api/parents_prisma.py",
        "app/api/results_prisma.py",
        "app/api/students_prisma.py",
        "app/api/teachers_prisma.py",
        "app/api/users_prisma.py",
        "app/db/session.py",
        "app/db/prisma_client.py",
        "prisma/schema.prisma",
        "requirements.txt",
    ]

    missing = []
    for file_path in required_files:
        full_path = backend_dir / file_path
        if not full_path.exists():
            missing.append(file_path)

    if missing:
        print("  ❌ Missing required files:")
        for file_path in missing:
            print(f"    - {file_path}")
        return False
    else:
        print("  ✅ All required files present")
        return True

def check_dependencies():
    """Check critical dependencies"""
    print("🔍 Checking dependencies...")

    try:
        import fastapi
        print(f"  ✅ FastAPI {fastapi.__version__}")
    except ImportError:
        print("  ❌ FastAPI not installed")
        return False

    try:
        import prisma
        print(f"  ✅ Prisma installed")
    except ImportError:
        print("  ❌ Prisma not installed")
        return False

    try:
        import uvicorn
        print(f"  ✅ Uvicorn installed")
    except ImportError:
        print("  ❌ Uvicorn not installed")
        return False

    try:
        import pydantic
        print(f"  ✅ Pydantic {pydantic.__version__}")
    except ImportError:
        print("  ❌ Pydantic not installed")
        return False

    return True

async def main():
    """Run all verification checks"""
    print("🚀 PTS Manager Backend Deployment Verification")
    print("=" * 50)

    checks = [
        ("Dependencies", check_dependencies()),
        ("Required Files", check_required_files()),
        ("Legacy File Conflicts", check_legacy_files()),
        ("Environment Configuration", check_environment()),
        ("Critical Imports", check_imports()),
        ("Prisma Connection", await check_prisma_connection()),
    ]

    passed = 0
    total = len(checks)

    print("\n📊 Verification Results:")
    print("-" * 30)

    for check_name, result in checks:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{check_name:.<25} {status}")
        if result:
            passed += 1

    print("-" * 30)
    print(f"Overall: {passed}/{total} checks passed")

    if passed == total:
        print("\n🎉 SUCCESS: Backend is ready for production deployment!")
        print("\n🚀 You can now deploy to:")
        print("  - Render")
        print("  - Railway")
        print("  - Heroku")
        print("  - Docker containers")
        print("  - Any Python hosting platform")

        print("\n📝 Deployment commands:")
        print("  pip install -r requirements.txt")
        print("  python -m prisma generate")
        print("  python -m prisma db push  # (if needed)")
        print("  uvicorn app.main:app --host 0.0.0.0 --port $PORT")

        return True
    else:
        print(f"\n❌ FAILED: {total - passed} issue(s) need to be resolved before deployment")
        return False

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Verification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Verification failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
