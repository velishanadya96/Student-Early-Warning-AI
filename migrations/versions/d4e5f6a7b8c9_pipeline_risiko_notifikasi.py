"""pipeline impor data, skor risiko, dan notifikasi WhatsApp

Perubahan:
- mahasiswa.id_user boleh kosong (mahasiswa hasil impor SIAKAD yang belum punya akun)
- presensi: rekap per mata kuliah per periode (total_pertemuan, hadir)
- tugas: tambah periode, judul
- risk_score: tambah detail (JSON fitur + faktor penyebab)
- notifikasi: tambah no_tujuan, percobaan, dibuat_at, dikirim_at

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-10-15 10:00:00

"""
from alembic import op
import sqlalchemy as sa


revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def _kolom(tabel):
    insp = sa.inspect(op.get_bind())
    return {c['name'] for c in insp.get_columns(tabel)}


def _index(tabel):
    insp = sa.inspect(op.get_bind())
    return {i['name'] for i in insp.get_indexes(tabel)}


def _tambah_kolom(tabel, kolom):
    """Tambah kolom hanya jika belum ada, supaya migrasi aman diulang setelah gagal di tengah
    (DDL MySQL tidak bisa di-rollback)."""
    if kolom.name in _kolom(tabel):
        return
    with op.batch_alter_table(tabel) as b:
        b.add_column(kolom)


def upgrade():
    with op.batch_alter_table('mahasiswa') as b:
        b.alter_column('id_user', existing_type=sa.Integer(), nullable=True)

    # Tabel presensi lama (per pertemuan) belum pernah dipakai endpoint mana pun -> dibuat ulang dengan bentuk rekap.
    insp = sa.inspect(op.get_bind())
    if 'presensi' not in insp.get_table_names() or 'total_pertemuan' not in _kolom('presensi'):
        if 'presensi' in insp.get_table_names():
            op.drop_table('presensi')
        op.create_table(
            'presensi',
            sa.Column('id_presensi', sa.Integer(), nullable=False),
            sa.Column('nim', sa.String(length=20), nullable=False),
            sa.Column('kode_mk', sa.String(length=20), nullable=False),
            sa.Column('periode', sa.String(length=20), nullable=False),
            sa.Column('total_pertemuan', sa.Integer(), nullable=False),
            sa.Column('hadir', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['nim'], ['mahasiswa.nim']),
            sa.PrimaryKeyConstraint('id_presensi'),
        )
    if 'ix_presensi_nim' not in _index('presensi'):
        op.create_index('ix_presensi_nim', 'presensi', ['nim'])
    if 'ix_presensi_periode' not in _index('presensi'):
        op.create_index('ix_presensi_periode', 'presensi', ['periode'])

    _tambah_kolom('tugas', sa.Column('periode', sa.String(length=20), nullable=False, server_default='-'))
    _tambah_kolom('tugas', sa.Column('judul', sa.String(length=150), nullable=True))
    if 'ix_tugas_periode' not in _index('tugas'):
        op.create_index('ix_tugas_periode', 'tugas', ['periode'])

    # risk_score sudah punya UNIQUE (nim, periode) sejak skema awal -> hanya tambah kolom detail.
    _tambah_kolom('risk_score', sa.Column('detail', sa.Text(), nullable=True))

    _tambah_kolom('notifikasi', sa.Column('no_tujuan', sa.String(length=20), nullable=True))
    _tambah_kolom('notifikasi', sa.Column('percobaan', sa.Integer(), nullable=False, server_default='0'))
    _tambah_kolom('notifikasi', sa.Column('dibuat_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    _tambah_kolom('notifikasi', sa.Column('dikirim_at', sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table('notifikasi') as b:
        b.drop_column('dikirim_at')
        b.drop_column('dibuat_at')
        b.drop_column('percobaan')
        b.drop_column('no_tujuan')
    with op.batch_alter_table('risk_score') as b:
        b.drop_column('detail')
    with op.batch_alter_table('tugas') as b:
        b.drop_index('ix_tugas_periode')
        b.drop_column('judul')
        b.drop_column('periode')
    op.drop_table('presensi')
    op.create_table(
        'presensi',
        sa.Column('id_presensi', sa.Integer(), nullable=False),
        sa.Column('nim', sa.String(length=20), nullable=False),
        sa.Column('kode_mk', sa.String(length=20), nullable=False),
        sa.Column('pertemuan', sa.Integer(), nullable=False),
        sa.Column('status_kehadiran', sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(['nim'], ['mahasiswa.nim']),
        sa.PrimaryKeyConstraint('id_presensi'),
    )
    with op.batch_alter_table('mahasiswa') as b:
        b.alter_column('id_user', existing_type=sa.Integer(), nullable=False)
