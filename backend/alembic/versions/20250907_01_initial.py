"""initial

Revision ID: 20250907_01_initial
Revises:
Create Date: 2025-09-07
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250907_01_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='active')
    )
    op.create_table('teachers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('phone', sa.String()),
        sa.Column('subjects', sa.Text())
    )
    op.create_table('parents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('phone', sa.String()),
        sa.Column('profile_picture_url', sa.String())
    )
    op.create_table('classes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('teacher_id', sa.Integer(), sa.ForeignKey('teachers.id')),
        sa.Column('room', sa.String()),
        sa.Column('subjects', sa.Text()),
        sa.Column('expected_students', sa.Integer(), server_default='0')
    )
    op.create_table('students',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('class_id', sa.Integer(), sa.ForeignKey('classes.id')),
        sa.Column('roll_no', sa.String(), unique=True),
        sa.Column('parent_id', sa.Integer(), sa.ForeignKey('parents.id')),
        sa.Column('email', sa.String(), unique=True),
        sa.Column('status', sa.String(), server_default='active')
    )
    op.create_table('events',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('date', sa.Date()),
        sa.Column('time', sa.Time()),
        sa.Column('type', sa.String()),
        sa.Column('status', sa.String(), server_default='scheduled')
    )
    op.create_table('messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('body', sa.Text()),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('recipient_role', sa.String()),
        sa.Column('created_at', sa.String())
    )

def downgrade():
    for table in ['messages','events','students','classes','parents','teachers','users']:
        op.drop_table(table)
