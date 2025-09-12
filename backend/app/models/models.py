from sqlalchemy import Column, String, Integer, ForeignKey, Date, Time, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    status = Column(String, default="active")
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_expires_at = Column(String, nullable=True)
    refresh_token_hash = Column(String, nullable=True)
    refresh_token_expires_at = Column(String, nullable=True)

    parent = relationship("Parent", back_populates="user", uselist=False)
    teacher = relationship("Teacher", back_populates="user", uselist=False)

class Parent(Base):
    __tablename__ = "parents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    phone = Column(String)
    profile_picture_url = Column(String, nullable=True)

    user = relationship("User", back_populates="parent")
    students = relationship("Student", back_populates="parent")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    phone = Column(String)
    subjects = Column(Text)  # comma separated for simplicity
    status = Column(String, default="active")  # new: active, on_leave, retired

    user = relationship("User", back_populates="teacher")
    classes = relationship("Class", back_populates="teacher")

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    room = Column(String)
    subjects = Column(Text)  # comma separated
    expected_students = Column(Integer, default=0)

    teacher = relationship("Teacher", back_populates="classes")
    students = relationship("Student", back_populates="class_")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"))
    roll_no = Column(String, unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id"))
    email = Column(String, unique=True, nullable=True)
    status = Column(String, default="active")

    parent = relationship("Parent", back_populates="students")
    class_ = relationship("Class", back_populates="students")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(Date)
    time = Column(Time)
    type = Column(String)
    status = Column(String, default="scheduled")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    body = Column(Text)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    recipient_role = Column(String)  # e.g., parent, teacher, admin
    created_at = Column(String)  # ISO timestamp for simplicity
    read_at = Column(String, nullable=True)  # ISO timestamp for simplicity

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject = Column(String, nullable=False)
    term = Column(String, nullable=False)  # e.g., "1st-term", "2nd-term", "3rd-term"
    score = Column(Integer, nullable=False)
    grade = Column(String, nullable=False)
    date = Column(String, nullable=True)  # ISO date string
    comments = Column(Text, nullable=True)
    created_at = Column(String, nullable=True)  # ISO timestamp

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    date = Column(String, nullable=False)  # ISO date string (YYYY-MM-DD)
    status = Column(String, nullable=False)  # "present", "absent", "late", "excused"
    notes = Column(Text, nullable=True)  # Optional notes about absence/lateness
    created_at = Column(String, nullable=True)  # ISO timestamp
    updated_at = Column(String, nullable=True)  # ISO timestamp

    # Relationships
    student = relationship("Student", foreign_keys=[student_id])
    class_ = relationship("Class", foreign_keys=[class_id])
    teacher = relationship("Teacher", foreign_keys=[teacher_id])
