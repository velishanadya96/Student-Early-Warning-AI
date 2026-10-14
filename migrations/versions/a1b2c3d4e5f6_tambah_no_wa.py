"""tambah no_wa pada dosen_pa dan orang_tua

Revision ID: a1b2c3d4e5f6
Revises: 1c7f9c84f95c
Create Date: 2026-10-12 00:20:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '1c7f9c84f95c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('dosen_pa', schema=None) as batch_op:
        batch_op.add_column(sa.Column('no_wa', sa.String(length=20), nullable=True))
    with op.batch_alter_table('orang_tua', schema=None) as batch_op:
        batch_op.add_column(sa.Column('no_wa', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('orang_tua', schema=None) as batch_op:
        batch_op.drop_column('no_wa')
    with op.batch_alter_table('dosen_pa', schema=None) as batch_op:
        batch_op.drop_column('no_wa')
