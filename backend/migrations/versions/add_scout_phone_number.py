"""add scout phone_number

Revision ID: scoutphone001
Revises: de33c7e6e966
Create Date: 2026-10-12
"""
from alembic import op
import sqlalchemy as sa


revision = 'scoutphone001'
down_revision = 'de33c7e6e966'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('scouts') as batch_op:
        batch_op.add_column(sa.Column('phone_number', sa.String(length=30), nullable=True))


def downgrade():
    with op.batch_alter_table('scouts') as batch_op:
        batch_op.drop_column('phone_number')