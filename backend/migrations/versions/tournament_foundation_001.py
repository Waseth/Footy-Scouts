"""tournament foundation — teams, tournament teams, invitations, payouts

Revision ID: tourfound001
Revises: scoutphone001
Create Date: 2026-10-19
"""
from alembic import op
import sqlalchemy as sa


revision = 'tourfound001'
down_revision = '0bfe2c61d523'
branch_labels = None
depends_on = None


def upgrade():
    # ─────────────────────────────────────────────────────────────
    #  1. New columns on tournaments
    # ─────────────────────────────────────────────────────────────
    with op.batch_alter_table('tournaments') as batch_op:
        batch_op.add_column(sa.Column('required_teams', sa.Integer(), nullable=False, server_default='8'))
        batch_op.add_column(sa.Column('min_players_per_team', sa.Integer(), nullable=False, server_default='5'))
        batch_op.add_column(sa.Column('max_players_per_team', sa.Integer(), nullable=False, server_default='8'))
        batch_op.add_column(sa.Column('team_entry_fee', sa.Numeric(10, 2), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('platform_fee_per_team', sa.Numeric(10, 2), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('tournament_fee_total', sa.Numeric(10, 2), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('total_required_from_teams', sa.Numeric(10, 2), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('published_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('registration_closed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('payout_code', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('payout_status', sa.String(20), nullable=False, server_default='PENDING'))
        batch_op.add_column(sa.Column('paid_out_at', sa.DateTime(), nullable=True))

    op.create_index('idx_tournaments_payout_code', 'tournaments', ['payout_code'])

    # ─────────────────────────────────────────────────────────────
    #  2. teams
    # ─────────────────────────────────────────────────────────────
    op.create_table(
        'teams',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('captain_user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('logo_public_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('idx_teams_captain', 'teams', ['captain_user_id'])
    op.create_index('idx_teams_name', 'teams', ['name'])

    # ─────────────────────────────────────────────────────────────
    #  3. team_members
    # ─────────────────────────────────────────────────────────────
    op.create_table(
        'team_members',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36),
                  sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='ACTIVE'),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
        sa.Column('removed_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('team_id', 'user_id', name='uq_team_member'),
    )
    op.create_index('idx_team_members_team', 'team_members', ['team_id'])
    op.create_index('idx_team_members_user', 'team_members', ['user_id'])
    op.create_index('idx_team_members_status', 'team_members', ['status'])

    # ─────────────────────────────────────────────────────────────
    #  4. player_invitations
    # ─────────────────────────────────────────────────────────────
    op.create_table(
        'player_invitations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36),
                  sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invited_user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invited_by_user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
    )
    op.create_index('idx_player_invitations_team', 'player_invitations', ['team_id'])
    op.create_index('idx_player_invitations_invitee', 'player_invitations', ['invited_user_id'])
    op.create_index('idx_player_invitations_status', 'player_invitations', ['status'])

    # ─────────────────────────────────────────────────────────────
    #  5. player_join_requests
    # ─────────────────────────────────────────────────────────────
    op.create_table(
        'player_join_requests',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('team_id', sa.String(36),
                  sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
    )
    op.create_index('idx_player_join_requests_team', 'player_join_requests', ['team_id'])
    op.create_index('idx_player_join_requests_user', 'player_join_requests', ['user_id'])
    op.create_index('idx_player_join_requests_status', 'player_join_requests', ['status'])

    # ─────────────────────────────────────────────────────────────
    #  6. tournament_teams
    # ─────────────────────────────────────────────────────────────
    op.create_table(
        'tournament_teams',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('tournament_id', sa.String(36),
                  sa.ForeignKey('tournaments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', sa.String(36),
                  sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='INVITED'),
        sa.Column('invited_by_organizer', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('entry_payment_id', sa.String(36),
                  sa.ForeignKey('payments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('registered_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('tournament_id', 'team_id', name='uq_tournament_team'),
    )
    op.create_index('idx_tournament_teams_tournament', 'tournament_teams', ['tournament_id'])
    op.create_index('idx_tournament_teams_team', 'tournament_teams', ['team_id'])
    op.create_index('idx_tournament_teams_status', 'tournament_teams', ['status'])

    # ─────────────────────────────────────────────────────────────
    #  7. organizer_payouts
    # ─────────────────────────────────────────────────────────────
    op.create_table(
        'organizer_payouts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('tournament_id', sa.String(36),
                  sa.ForeignKey('tournaments.id', ondelete='CASCADE'),
                  nullable=False, unique=True),
        sa.Column('organizer_user_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('payout_code', sa.String(50), nullable=False, unique=True),
        sa.Column('gross_collected', sa.Numeric(10, 2), nullable=False),
        sa.Column('platform_fee_deducted', sa.Numeric(10, 2), nullable=False),
        sa.Column('net_to_organizer', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('payment_method', sa.String(20), nullable=True),
        sa.Column('transaction_reference', sa.String(255), nullable=True),
        sa.Column('initiated_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('paid_by_admin_id', sa.String(36),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
    )
    op.create_index('idx_organizer_payouts_tournament', 'organizer_payouts', ['tournament_id'])
    op.create_index('idx_organizer_payouts_organizer', 'organizer_payouts', ['organizer_user_id'])
    op.create_index('idx_organizer_payouts_status', 'organizer_payouts', ['status'])


def downgrade():
    op.drop_table('organizer_payouts')
    op.drop_table('tournament_teams')
    op.drop_table('player_join_requests')
    op.drop_table('player_invitations')
    op.drop_table('team_members')
    op.drop_table('teams')

    op.drop_index('idx_tournaments_payout_code', table_name='tournaments')

    with op.batch_alter_table('tournaments') as batch_op:
        batch_op.drop_column('paid_out_at')
        batch_op.drop_column('payout_status')
        batch_op.drop_column('payout_code')
        batch_op.drop_column('registration_closed_at')
        batch_op.drop_column('published_at')
        batch_op.drop_column('total_required_from_teams')
        batch_op.drop_column('tournament_fee_total')
        batch_op.drop_column('platform_fee_per_team')
        batch_op.drop_column('team_entry_fee')
        batch_op.drop_column('max_players_per_team')
        batch_op.drop_column('min_players_per_team')
        batch_op.drop_column('required_teams')