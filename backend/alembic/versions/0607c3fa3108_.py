"""empty message

Revision ID: 0607c3fa3108
Revises: 20250908_02_add_refresh_token_fields, 20250908_02_results
Create Date: 2025-09-09 09:25:56.613374

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0607c3fa3108'
down_revision = ('20250908_02_add_refresh_token_fields', '20250908_02_results')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
