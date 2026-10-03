"""replace payment gateways with paystack

Revision ID: de33c7e6e966
Revises: 7e515f5cea2b
Create Date: 2026-10-03
"""
from alembic import op
import sqlalchemy as sa


revision = 'de33c7e6e966'
down_revision = '7e515f5cea2b'
branch_labels = None
depends_on = None


def upgrade():
    # ── Drop old gateway columns ──
    with op.batch_alter_table('payments') as batch_op:
        batch_op.drop_column('mpesa_checkout_id')
        batch_op.drop_column('mpesa_receipt')
        batch_op.drop_column('stripe_payment_intent')
        batch_op.drop_column('paypal_order_id')

    # ── Add Paystack + purpose columns ──
    with op.batch_alter_table('payments') as batch_op:
        batch_op.add_column(sa.Column('purpose', sa.String(length=30),
                                      nullable=False, server_default='SUBSCRIPTION'))
        batch_op.add_column(sa.Column('paystack_reference', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('paystack_access_code', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('paystack_authorization_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('paystack_channel', sa.String(length=40), nullable=True))
        batch_op.add_column(sa.Column('email', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('team_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('tournament_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('raw_response', sa.Text(), nullable=True))

    # ── Indexes ──
    op.create_index('idx_payments_purpose', 'payments', ['purpose'])
    op.create_index('idx_payments_reference', 'payments', ['paystack_reference'], unique=True)


def downgrade():
    op.drop_index('idx_payments_reference', table_name='payments')
    op.drop_index('idx_payments_purpose', table_name='payments')

    with op.batch_alter_table('payments') as batch_op:
        batch_op.drop_column('raw_response')
        batch_op.drop_column('tournament_id')
        batch_op.drop_column('team_id')
        batch_op.drop_column('email')
        batch_op.drop_column('paystack_channel')
        batch_op.drop_column('paystack_authorization_url')
        batch_op.drop_column('paystack_access_code')
        batch_op.drop_column('paystack_reference')
        batch_op.drop_column('purpose')

    with op.batch_alter_table('payments') as batch_op:
        batch_op.add_column(sa.Column('paypal_order_id', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('stripe_payment_intent', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('mpesa_receipt', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('mpesa_checkout_id', sa.String(length=255), nullable=True))