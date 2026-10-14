"""verifikasi email dan penguncian akun pada tabel user

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-14 16:00:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        # server_default true: akun lama (seed/Admin) otomatis dianggap sudah terverifikasi
        batch_op.add_column(sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column('verify_token_hash', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('verify_expires_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('failed_logins', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('locked_until', sa.DateTime(), nullable=True))
        batch_op.create_index('ix_user_verify_token_hash', ['verify_token_hash'], unique=False)


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_index('ix_user_verify_token_hash')
        batch_op.drop_column('locked_until')
        batch_op.drop_column('failed_logins')
        batch_op.drop_column('verify_expires_at')
        batch_op.drop_column('verify_token_hash')
        batch_op.drop_column('email_verified')
