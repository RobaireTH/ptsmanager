"""add teacher status column

Revision ID: 20250908_01_add_teacher_status
Revises: b5ae2018e1bc
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.inspection import inspect

# revision identifiers, used by Alembic.
revision = '20250908_01_add_teacher_status'
down_revision = 'b5ae2018e1bc'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    try:
        columns = [c['name'] for c in inspector.get_columns('teachers')]
    except Exception:
        # Teachers table not yet present (shouldn't happen if chain intact); skip.
        return
    if 'status' not in columns:
        op.add_column('teachers', sa.Column('status', sa.String(), server_default='active'))


def downgrade():
    op.drop_column('teachers', 'status')
