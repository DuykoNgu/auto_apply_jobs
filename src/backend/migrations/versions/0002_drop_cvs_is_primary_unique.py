from alembic import op

revision = "0002"
down_revision = "0001"


def upgrade() -> None:
    op.execute("ALTER TABLE cvs DROP CONSTRAINT cvs_is_primary_key")


def downgrade() -> None:
    op.execute("ALTER TABLE cvs ADD CONSTRAINT cvs_is_primary_key UNIQUE (is_primary)")
