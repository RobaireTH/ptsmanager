"""
Alembic migration for results table.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250908_02_results'
# Chain results after refresh token fields migration to avoid parallel head
down_revision = '20250908_02_add_refresh_token_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'results',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id'), nullable=False),
        sa.Column('class_id', sa.Integer(), sa.ForeignKey('classes.id'), nullable=True),
        sa.Column('teacher_id', sa.Integer(), sa.ForeignKey('teachers.id'), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('term', sa.String(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('grade', sa.String(), nullable=False),
        sa.Column('date', sa.String(), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('created_at', sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('results')

