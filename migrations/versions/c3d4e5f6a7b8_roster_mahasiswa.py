"""tabel roster_mahasiswa (daftar mahasiswa resmi untuk verifikasi NIM)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-10-14 17:30:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'roster_mahasiswa',
        sa.Column('nim', sa.String(length=20), nullable=False),
        sa.Column('nama', sa.String(length=100), nullable=False),
        sa.Column('prodi', sa.String(length=100), nullable=True),
        sa.Column('angkatan', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint('nim'),
    )


def downgrade():
    op.drop_table('roster_mahasiswa')
