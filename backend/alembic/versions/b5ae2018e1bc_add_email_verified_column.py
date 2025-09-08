"""add_email_verified_column (SQLite safe)

Revision ID: b5ae2018e1bc
Revises: 20250907_02_user_email_verification_reset
Create Date: 2025-09-08 03:00:09.388011

Adjusted to add the column if missing instead of altering (SQLite does not support ALTER COLUMN DROP NOT NULL semantics).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.inspection import inspect

# revision identifiers, used by Alembic.
revision = 'b5ae2018e1bc'
down_revision = '20250907_02_user_email_verification_reset'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('users')]
    if 'email_verified' not in cols:
        op.add_column('users', sa.Column('email_verified', sa.Boolean(), server_default=sa.text('0'), nullable=False))
    # If column exists we skip altering nullability for SQLite simplicity.

def downgrade():
    # Only drop if present (dev convenience); production usually leaves column.
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('users')]
    if 'email_verified' in cols:
        op.drop_column('users', 'email_verified')
