from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
import re

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        # Require at least one lowercase, one uppercase, and one number
        if not re.search(r"[a-z]", v) or not re.search(r"[A-Z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must include at least one lowercase, one uppercase letter, and one number")
        return v

    @field_validator('email', mode='before')
    @classmethod
    def normalize_email(cls, v: str) -> str:
        v = (v or '').strip().lower()
        # Optional domain allowlist via env var ALLOWED_EMAIL_DOMAINS (comma-separated)
        import os
        allowed = os.getenv('ALLOWED_EMAIL_DOMAINS')
        if allowed:
            domains = [d.strip().lower() for d in allowed.split(',') if d.strip()]
            try:
                domain = v.split('@', 1)[1]
            except Exception:
                return v
            if domain not in domains:
                raise ValueError("Email domain is not allowed")
        return v

class User(UserBase):
    id: int
    status: str
    email_verified: bool = False
    class Config:
        from_attributes = True

class ParentBase(BaseModel):
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        # Remove all non-digit characters except + at the beginning
        cleaned = re.sub(r'[^\d+]', '', v)
        # Check if it starts with + and has at least 10 digits total
        if not re.match(r'^\+\d{10,15}$', cleaned):
            raise ValueError("Phone number must be in international format (+country code + number, 10-15 digits total)")
        return v

class ParentCreate(ParentBase):
    user_id: int

class Parent(ParentBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    phone: Optional[str] = None
    subjects: Optional[List[str]] = []
    status: Optional[str] = "active"

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        # Remove all non-digit characters except + at the beginning
        cleaned = re.sub(r'[^\d+]', '', v)
        # Check if it starts with + and has at least 10 digits total
        if not re.match(r'^\+\d{10,15}$', cleaned):
            raise ValueError("Phone number must be in international format (+country code + number, 10-15 digits total)")
        return v

class TeacherCreate(TeacherBase):
    user_id: int

class Teacher(TeacherBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class ClassBase(BaseModel):
    name: str
    teacher_id: Optional[int] = None
    room: Optional[str] = None
    subjects: Optional[List[str]] = []
    expected_students: Optional[int] = 0

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    id: int
    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    name: str
    class_id: Optional[int] = None
    roll_no: Optional[str] = None
    parent_id: Optional[int] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = "active"

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = "scheduled"

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    subject: str
    body: Optional[str] = None
    recipient_id: Optional[int] = None
    recipient_role: Optional[str] = None

class MessageCreate(MessageBase):
    sender_id: int

class Message(MessageBase):
    id: int
    sender_id: int
    created_at: str
    read_at: Optional[str] = None
    class Config:
        from_attributes = True

# Results
class ResultBase(BaseModel):
    student_id: int
    class_id: Optional[int] = None
    teacher_id: int
    subject: str
    term: str
    score: int
    grade: str
    date: Optional[str] = None
    comments: Optional[str] = None

class ResultCreate(ResultBase):
    pass

class ResultUpdate(BaseModel):
    subject: Optional[str] = None
    term: Optional[str] = None
    score: Optional[int] = None
    grade: Optional[str] = None
    date: Optional[str] = None
    comments: Optional[str] = None

class Result(ResultBase):
    id: int
    created_at: Optional[str] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
