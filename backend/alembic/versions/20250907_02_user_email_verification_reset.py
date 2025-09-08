"""add email verification and reset columns

Revision ID: 20250907_02_user_email_verification_reset
Revises: 20250907_01_initial
Create Date: 2025-09-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.inspection import inspect

# revision identifiers, used by Alembic.
revision = '20250907_02_user_email_verification_reset'
down_revision = '20250907_01_initial'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]

    if 'email_verification_token' not in columns:
        op.add_column('users', sa.Column('email_verification_token', sa.String(), nullable=True))
    if 'password_reset_token' not in columns:
        op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    if 'password_reset_expires_at' not in columns:
        op.add_column('users', sa.Column('password_reset_expires_at', sa.String(), nullable=True))

def downgrade():
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'email_verification_token')
