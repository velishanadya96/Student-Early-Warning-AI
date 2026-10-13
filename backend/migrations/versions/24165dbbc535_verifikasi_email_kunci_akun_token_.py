"""verifikasi email, kunci akun, token dicabut

Revision ID: 24165dbbc535
Revises: 1c7f9c84f95c
Create Date: 2026-10-13 23:24:36.332231

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '24165dbbc535'
down_revision = '1c7f9c84f95c'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('revoked_token',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('jti', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('revoked_token', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_revoked_token_jti'), ['jti'], unique=True)

    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email_verified_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('failed_logins', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('locked_until', sa.DateTime(), nullable=True))

    # Akun yang sudah ada sebelum fitur verifikasi dianggap terverifikasi (kalau tidak, semuanya langsung terkunci).
    user = sa.table('user', sa.column('email_verified_at', sa.DateTime), sa.column('created_at', sa.DateTime))
    op.execute(user.update().where(user.c.email_verified_at.is_(None)).values(email_verified_at=user.c.created_at))


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('locked_until')
        batch_op.drop_column('failed_logins')
        batch_op.drop_column('email_verified_at')

    with op.batch_alter_table('revoked_token', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_revoked_token_jti'))

    op.drop_table('revoked_token')
