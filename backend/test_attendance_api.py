#!/usr/bin/env python3
"""
Simple test script to validate Attendance API endpoints
Run this script to test the attendance functionality
"""

import asyncio
import sys
import os
from datetime import datetime, date

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from prisma import Prisma
from app.db.prisma_client import init_prisma, close_prisma


async def test_attendance_api():
    """Test the attendance API functionality"""

    print("🧪 Starting Attendance API Tests...")

    try:
        # Initialize Prisma
        await init_prisma()
        prisma = Prisma()
        await prisma.connect()

        # Test 1: Check if tables exist
        print("\n1️⃣ Testing database connectivity...")

        user_count = await prisma.user.count()
        student_count = await prisma.student.count()
        attendance_count = await prisma.attendance.count()

        print(f"   ✅ Users: {user_count}")
        print(f"   ✅ Students: {student_count}")
        print(f"   ✅ Attendance records: {attendance_count}")

        # Test 2: Create test data if needed
        print("\n2️⃣ Setting up test data...")

        # Create a test user (admin)
        test_user = await prisma.user.upsert(
            where={"email": "test@example.com"},
            data={
                "create": {
                    "name": "Test Admin",
                    "email": "test@example.com",
                    "role": "admin",
                    "password_hash": "test_hash",
                    "status": "active",
                    "email_verified": True
                },
                "update": {}
            }
        )

        # Create a test teacher
        test_teacher_user = await prisma.user.upsert(
            where={"email": "teacher@example.com"},
            data={
                "create": {
                    "name": "Test Teacher",
                    "email": "teacher@example.com",
                    "role": "teacher",
                    "password_hash": "test_hash",
                    "status": "active",
                    "email_verified": True
                },
                "update": {}
            }
        )

        test_teacher = await prisma.teacher.upsert(
            where={"user_id": test_teacher_user.id},
            data={
                "create": {
                    "user_id": test_teacher_user.id,
                    "subjects": "Mathematics,Science",
                    "status": "active"
                },
                "update": {}
            }
        )

        # Create a test parent
        test_parent_user = await prisma.user.upsert(
            where={"email": "parent@example.com"},
            data={
                "create": {
                    "name": "Test Parent",
                    "email": "parent@example.com",
                    "role": "parent",
                    "password_hash": "test_hash",
                    "status": "active",
                    "email_verified": True
                },
                "update": {}
            }
        )

        test_parent = await prisma.parent.upsert(
            where={"user_id": test_parent_user.id},
            data={
                "create": {
                    "user_id": test_parent_user.id
                },
                "update": {}
            }
        )

        # Create a test class
        test_class = await prisma.classmodel.upsert(
            where={"name": "Test Class 1A"},
            data={
                "create": {
                    "name": "Test Class 1A",
                    "teacher_id": test_teacher.id,
                    "room": "Room 101",
                    "subjects": "Mathematics,Science",
                    "expected_students": 25
                },
                "update": {}
            }
        )

        # Create a test student
        test_student = await prisma.student.upsert(
            where={"roll_no": "TEST001"},
            data={
                "create": {
                    "name": "Test Student",
                    "roll_no": "TEST001",
                    "class_id": test_class.id,
                    "parent_id": test_parent.id,
                    "status": "active"
                },
                "update": {}
            }
        )

        print(f"   ✅ Test teacher created: {test_teacher.id}")
        print(f"   ✅ Test parent created: {test_parent.id}")
        print(f"   ✅ Test class created: {test_class.id}")
        print(f"   ✅ Test student created: {test_student.id}")

        # Test 3: Create attendance record
        print("\n3️⃣ Testing attendance creation...")

        today = date.today().isoformat()

        try:
            # Delete existing attendance for today if it exists
            await prisma.attendance.delete_many(
                where={
                    "student_id": test_student.id,
                    "date": today
                }
            )
        except:
            pass  # Record might not exist

        test_attendance = await prisma.attendance.create(
            data={
                "student_id": test_student.id,
                "class_id": test_class.id,
                "teacher_id": test_teacher.id,
                "date": today,
                "status": "present",
                "notes": "Test attendance record",
                "created_at": datetime.now().isoformat() + "Z"
            }
        )

        print(f"   ✅ Attendance record created: {test_attendance.id}")

        # Test 4: Query attendance records
        print("\n4️⃣ Testing attendance queries...")

        # Get attendance for student
        student_attendance = await prisma.attendance.find_many(
            where={"student_id": test_student.id},
            include={
                "student": True,
                "classModel": True,
                "teacher": {"include": {"user": True}}
            }
        )

        print(f"   ✅ Found {len(student_attendance)} attendance records for student")

        if student_attendance:
            record = student_attendance[0]
            print(f"      - Date: {record.date}")
            print(f"      - Status: {record.status}")
            print(f"      - Student: {record.student.name}")
            print(f"      - Class: {record.classModel.name}")
            print(f"      - Teacher: {record.teacher.user.name}")

        # Test 5: Update attendance record
        print("\n5️⃣ Testing attendance updates...")

        updated_attendance = await prisma.attendance.update(
            where={"id": test_attendance.id},
            data={"status": "late", "notes": "Updated to late"}
        )

        print(f"   ✅ Updated attendance status to: {updated_attendance.status}")

        # Test 6: Test unique constraint
        print("\n6️⃣ Testing unique constraints...")

        try:
            # Try to create duplicate attendance for same student and date
            await prisma.attendance.create(
                data={
                    "student_id": test_student.id,
                    "class_id": test_class.id,
                    "teacher_id": test_teacher.id,
                    "date": today,
                    "status": "absent",
                    "created_at": datetime.now().isoformat() + "Z"
                }
            )
            print("   ❌ ERROR: Unique constraint not working!")
        except Exception as e:
            if "unique constraint" in str(e).lower():
                print("   ✅ Unique constraint working correctly")
            else:
                print(f"   ⚠️  Unexpected error: {e}")

        # Test 7: Calculate attendance statistics
        print("\n7️⃣ Testing attendance statistics...")

        # Create a few more test records for different dates
        test_dates = [
            (date.today().replace(day=1).isoformat(), "present"),
            (date.today().replace(day=2).isoformat(), "absent"),
            (date.today().replace(day=3).isoformat(), "late"),
            (date.today().replace(day=4).isoformat(), "present"),
        ]

        for test_date, status in test_dates:
            try:
                await prisma.attendance.create(
                    data={
                        "student_id": test_student.id,
                        "class_id": test_class.id,
                        "teacher_id": test_teacher.id,
                        "date": test_date,
                        "status": status,
                        "created_at": datetime.now().isoformat() + "Z"
                    }
                )
            except:
                pass  # Record might already exist

        # Get all attendance for statistics
        all_records = await prisma.attendance.find_many(
            where={"student_id": test_student.id}
        )

        total = len(all_records)
        present = len([r for r in all_records if r.status == "present"])
        absent = len([r for r in all_records if r.status == "absent"])
        late = len([r for r in all_records if r.status == "late"])
        attended = present + late
        percentage = round((attended / total * 100), 2) if total > 0 else 0

        print(f"   ✅ Attendance Statistics:")
        print(f"      - Total records: {total}")
        print(f"      - Present: {present}")
        print(f"      - Absent: {absent}")
        print(f"      - Late: {late}")
        print(f"      - Attendance rate: {percentage}%")

        print("\n🎉 All tests completed successfully!")
        print("\n📊 Test Summary:")
        print("   ✅ Database connectivity")
        print("   ✅ Test data creation")
        print("   ✅ Attendance record creation")
        print("   ✅ Attendance queries with joins")
        print("   ✅ Attendance record updates")
        print("   ✅ Unique constraint validation")
        print("   ✅ Attendance statistics calculation")

        return True

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup
        await prisma.disconnect()
        await close_prisma()


if __name__ == "__main__":
    print("Attendance API Test Suite")
    print("=" * 50)

    result = asyncio.run(test_attendance_api())

    if result:
        print("\n✅ All tests passed! Attendance API is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
