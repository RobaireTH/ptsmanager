from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
import time
from prisma import Prisma

from app.api.auth import get_current_user, get_current_user_or_dev, require_role
from app.db.prisma_client import prisma as _prisma, init_prisma as _init_prisma

async def get_prisma() -> Prisma:
    """FastAPI dependency returning a connected global Prisma client.

    Ensures the shared client is connected (lazy) instead of creating a new
    instance per request (avoids connection churn and mismatched delegates).
    """
    if not _prisma.is_connected():
        await _init_prisma()
    return _prisma

router = APIRouter(prefix="/attendance", tags=["attendance"])

# Helpers

def _now_iso() -> str:
    """Return current timestamp in ISO format"""
    return datetime.utcnow().isoformat() + "Z"


def _date_to_iso(date_str: str) -> str:
    """Ensure date is in YYYY-MM-DD format"""
    try:
        # Parse the date and return in ISO format
        parsed_date = datetime.fromisoformat(date_str.replace('Z', '')).date()
        return parsed_date.isoformat()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")


async def _teacher_can_access_student(prisma: Prisma, teacher_id: int, student_id: int) -> bool:
    """Check if teacher can access student (must be student's class teacher)"""
    student = await prisma.student.find_unique(
        where={"id": student_id},
        include={"classModel": True}
    )
    if not student or not student.classModel:
        return False
    return student.classModel.teacher_id == teacher_id


@router.post("/", response_model=dict)
async def create_attendance_record(
    student_id: int,
    date: str,
    status: str,
    class_id: Optional[int] = None,
    notes: Optional[str] = None,
    prisma: Prisma = Depends(get_prisma),
    user = Depends(require_role("teacher"))
):
    """Create attendance record for a student"""

    # Validate status
    valid_statuses = ["present", "absent", "late", "excused"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    # Validate date format
    iso_date = _date_to_iso(date)

    # Check if student exists and teacher can access
    if not await _teacher_can_access_student(prisma, user.teacher.id, student_id):
        raise HTTPException(status_code=403, detail="Not allowed to record attendance for this student")

    # Get student details for class_id if not provided
    if not class_id:
        student = await prisma.student.find_unique(where={"id": student_id})
        if student:
            class_id = student.class_id

    try:
        # Check for existing record (unique constraint on student_id + date)
        existing = await prisma.attendance.find_first(
            where={
                "student_id": student_id,
                "date": iso_date
            }
        )

        if existing:
            raise HTTPException(status_code=400, detail="Attendance already recorded for this student on this date")

        # Create attendance record
        attendance = await prisma.attendance.create(
            data={
                "student_id": student_id,
                "class_id": class_id,
                "teacher_id": user.teacher.id,
                "date": iso_date,
                "status": status,
                "notes": notes,
                "created_at": _now_iso()
            }
        )

        return {
            "id": attendance.id,
            "student_id": attendance.student_id,
            "class_id": attendance.class_id,
            "teacher_id": attendance.teacher_id,
            "date": attendance.date,
            "status": attendance.status,
            "notes": attendance.notes,
            "created_at": attendance.created_at
        }

    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="Attendance already recorded for this student on this date")
        raise HTTPException(status_code=500, detail=f"Failed to create attendance record: {str(e)}")


@router.get("/", response_model=List[dict])
async def list_attendance_records(
    prisma: Prisma = Depends(get_prisma),
    user = Depends(get_current_user_or_dev),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    student_id: Optional[int] = None,
    class_id: Optional[int] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """List attendance records with role-based filtering"""

    # Build filters based on role
    where_conditions = {}

    if user.role == 'teacher' and user.teacher:
        # Teachers can only see attendance for their classes
        teacher_classes = await prisma.classmodel.find_many(
            where={"teacher_id": user.teacher.id},
            select={"id": True}
        )
        class_ids = [cls.id for cls in teacher_classes]
        if class_ids:
            where_conditions["class_id"] = {"in": class_ids}
        else:
            return []  # Teacher has no classes

    elif user.role == 'parent' and user.parent:
        # Parents can only see attendance for their children
        parent_students = await prisma.student.find_many(
            where={"parent_id": user.parent.id},
            select={"id": True}
        )
        student_ids = [s.id for s in parent_students]
        if student_ids:
            where_conditions["student_id"] = {"in": student_ids}
        else:
            return []  # Parent has no children

    # Apply additional filters
    if student_id is not None:
        where_conditions["student_id"] = student_id

    if class_id is not None:
        where_conditions["class_id"] = class_id

    if date is not None:
        where_conditions["date"] = _date_to_iso(date)

    if status is not None:
        where_conditions["status"] = status

    # Date range filtering
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["gte"] = _date_to_iso(date_from)
        if date_to:
            date_filter["lte"] = _date_to_iso(date_to)
        where_conditions["date"] = date_filter

    # Fetch attendance records with related data
    attendance_records = await prisma.attendance.find_many(
        where=where_conditions,
        include={
            "student": True,
            "classModel": True,
            "teacher": {"include": {"user": True}}
        },
        skip=offset,
        take=limit,
        order={"date": "desc"}
    )

    # Format response
    result = []
    for record in attendance_records:
        result.append({
            "id": record.id,
            "student_id": record.student_id,
            "student_name": record.student.name if record.student else None,
            "class_id": record.class_id,
            "class_name": record.classModel.name if record.classModel else None,
            "teacher_id": record.teacher_id,
            "teacher_name": record.teacher.user.name if record.teacher and record.teacher.user else None,
            "date": record.date,
            "status": record.status,
            "notes": record.notes,
            "created_at": record.created_at,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None
        })

    return result


@router.patch("/{attendance_id}", response_model=dict)
async def update_attendance_record(
    attendance_id: int,
    status: Optional[str] = None,
    notes: Optional[str] = None,
    prisma: Prisma = Depends(get_prisma),
    user = Depends(get_current_user)
):
    """Update attendance record"""

    # Find the attendance record
    attendance = await prisma.attendance.find_unique(
        where={"id": attendance_id},
        include={"student": True}
    )

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Authorization check
    if user.role == 'teacher' and user.teacher:
        if not await _teacher_can_access_student(prisma, user.teacher.id, attendance.student_id):
            raise HTTPException(status_code=403, detail="Not allowed to modify this attendance record")
    elif user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")

    # Validate status if provided
    if status is not None:
        valid_statuses = ["present", "absent", "late", "excused"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )

    # Update the record
    update_data = {}
    if status is not None:
        update_data["status"] = status
    if notes is not None:
        update_data["notes"] = notes

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    updated_attendance = await prisma.attendance.update(
        where={"id": attendance_id},
        data=update_data
    )

    return {
        "id": updated_attendance.id,
        "student_id": updated_attendance.student_id,
        "class_id": updated_attendance.class_id,
        "teacher_id": updated_attendance.teacher_id,
        "date": updated_attendance.date,
        "status": updated_attendance.status,
        "notes": updated_attendance.notes,
        "created_at": updated_attendance.created_at,
        "updated_at": updated_attendance.updated_at.isoformat() if updated_attendance.updated_at else None
    }


@router.delete("/{attendance_id}")
async def delete_attendance_record(
    attendance_id: int,
    prisma: Prisma = Depends(get_prisma),
    user = Depends(get_current_user)
):
    """Delete attendance record"""

    # Find the attendance record
    attendance = await prisma.attendance.find_unique(where={"id": attendance_id})

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Authorization check
    if user.role == 'teacher' and user.teacher:
        if not await _teacher_can_access_student(prisma, user.teacher.id, attendance.student_id):
            raise HTTPException(status_code=403, detail="Not allowed to delete this attendance record")
    elif user.role != 'admin':
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete the record
    await prisma.attendance.delete(where={"id": attendance_id})

    return {"deleted": True}


@router.get("/summary", response_model=dict)
async def get_attendance_summary(
    prisma: Prisma = Depends(get_prisma),
    user = Depends(get_current_user_or_dev),
    student_id: Optional[int] = None,
    class_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get attendance summary statistics"""

    # Build base filter conditions
    where_conditions = {}

    if user.role == 'teacher' and user.teacher:
        teacher_classes = await prisma.classmodel.find_many(
            where={"teacher_id": user.teacher.id},
            select={"id": True}
        )
        class_ids = [cls.id for cls in teacher_classes]
        if class_ids:
            where_conditions["class_id"] = {"in": class_ids}
        else:
            return {"total": 0, "present": 0, "absent": 0, "late": 0, "excused": 0, "percentage": 0}

    elif user.role == 'parent' and user.parent:
        parent_students = await prisma.student.find_many(
            where={"parent_id": user.parent.id},
            select={"id": True}
        )
        student_ids = [s.id for s in parent_students]
        if student_ids:
            where_conditions["student_id"] = {"in": student_ids}
        else:
            return {"total": 0, "present": 0, "absent": 0, "late": 0, "excused": 0, "percentage": 0}

    # Apply filters
    if student_id is not None:
        where_conditions["student_id"] = student_id

    if class_id is not None:
        where_conditions["class_id"] = class_id

    # Date range filtering
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["gte"] = _date_to_iso(date_from)
        if date_to:
            date_filter["lte"] = _date_to_iso(date_to)
        where_conditions["date"] = date_filter

    # Get all records matching criteria
    records = await prisma.attendance.find_many(where=where_conditions)

    # Calculate summary
    total = len(records)
    present = len([r for r in records if r.status == "present"])
    absent = len([r for r in records if r.status == "absent"])
    late = len([r for r in records if r.status == "late"])
    excused = len([r for r in records if r.status == "excused"])

    # Calculate attendance percentage (present + late as "attended")
    attended = present + late
    percentage = round((attended / total * 100), 2) if total > 0 else 0

    return {
        "total": total,
        "present": present,
        "absent": absent,
        "late": late,
        "excused": excused,
        "attended": attended,
        "percentage": percentage
    }


@router.get("/daily/{date}", response_model=List[dict])
async def get_daily_attendance(
    date: str,
    prisma: Prisma = Depends(get_prisma),
    user = Depends(get_current_user_or_dev),
    class_id: Optional[int] = None
):
    """Get daily attendance for teacher's classes"""

    iso_date = _date_to_iso(date)

    # Get teacher's classes
    teacher_classes = await prisma.classmodel.find_many(
        where={"teacher_id": user.teacher.id},
        include={"students": True}
    )

    if not teacher_classes:
        return []

    # Filter by specific class if provided
    if class_id is not None:
        teacher_classes = [cls for cls in teacher_classes if cls.id == class_id]

    result = []

    for class_model in teacher_classes:
        # Get attendance records for this class on this date
        attendance_records = await prisma.attendance.find_many(
            where={
                "class_id": class_model.id,
                "date": iso_date
            },
            include={"student": True}
        )

        # Create a map of student_id -> attendance status
        attendance_map = {record.student_id: record for record in attendance_records}

        # Build response for each student in the class
        for student in class_model.students:
            attendance_record = attendance_map.get(student.id)
            result.append({
                "student_id": student.id,
                "student_name": student.name,
                "class_id": class_model.id,
                "class_name": class_model.name,
                "date": iso_date,
                "status": attendance_record.status if attendance_record else "not_recorded",
                "notes": attendance_record.notes if attendance_record else None,
                "attendance_id": attendance_record.id if attendance_record else None
            })

    return result
