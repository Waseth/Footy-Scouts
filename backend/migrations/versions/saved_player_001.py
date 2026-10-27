"""add saved_players table for shortlisting

Revision ID: savedpl001
Revises: tourfound001
Create Date: 2026-10-27
"""
from alembic import op
import sqlalchemy as sa


revision = 'savedpl001'
down_revision = 'tourfound001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'saved_players',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('player_user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('user_id', 'player_user_id', name='uq_saved_player'),
    )
    op.create_index('idx_saved_players_user', 'saved_players', ['user_id'])
    op.create_index('idx_saved_players_player', 'saved_players', ['player_user_id'])


def downgrade():
    op.drop_index('idx_saved_players_player', table_name='saved_players')
    op.drop_index('idx_saved_players_user', table_name='saved_players')
    op.drop_table('saved_players')