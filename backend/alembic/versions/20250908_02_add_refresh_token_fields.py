"""add refresh token fields

Revision ID: 20250908_02_add_refresh_token_fields
Revises: 20250908_01_add_teacher_status
Create Date: 2025-09-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.inspection import inspect

revision = '20250908_02_add_refresh_token_fields'
down_revision = '20250908_01_add_teacher_status'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('users')]
    if 'refresh_token_hash' not in cols:
        op.add_column('users', sa.Column('refresh_token_hash', sa.String(), nullable=True))
    if 'refresh_token_expires_at' not in cols:
        op.add_column('users', sa.Column('refresh_token_expires_at', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'refresh_token_expires_at')
    op.drop_column('users', 'refresh_token_hash')
