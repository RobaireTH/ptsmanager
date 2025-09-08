import json, os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import User, Parent, Teacher, Class, Student, Event
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Provide exported localStorage JSON in seed_data.json
DATA_FILE = os.getenv("SEED_FILE", "seed_data.json")

def load_json():
    if not os.path.exists(DATA_FILE):
        print("No seed_data.json found, skipping seed.")
        return None
    with open(DATA_FILE) as f:
        return json.load(f)

def seed():
    data = load_json()
    if not data:
        return
    db: Session = SessionLocal()
    try:
        # Users for each teacher/parent (simplified: password = 'password')
        for t in data.get('teachers', []):
            if not db.query(User).filter_by(email=t['email']).first():
                u = User(name=t['name'], email=t['email'], role='teacher', password_hash=pwd.hash('password'), status=t.get('status','active'))
                db.add(u); db.flush()
                db.add(Teacher(user_id=u.id, phone=t.get('phone'), subjects=','.join(t.get('subjects', []))))
        for p in data.get('parents', []):
            if not db.query(User).filter_by(email=p['email']).first():
                u = User(name=p['name'], email=p['email'], role='parent', password_hash=pwd.hash('password'), status=p.get('status','active'))
                db.add(u); db.flush()
                db.add(Parent(user_id=u.id, phone=p.get('phone'), profile_picture_url=None))
        db.commit()
    finally:
        db.close()

if __name__ == '__main__':
    seed()
