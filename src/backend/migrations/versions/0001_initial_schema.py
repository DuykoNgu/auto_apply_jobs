from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None

SQL_DIR = Path(__file__).resolve().parent.parent / "sql"


def upgrade() -> None:
    op.execute((SQL_DIR / "0001_initial_upgrade.sql").read_text())


def downgrade() -> None:
    op.execute((SQL_DIR / "0001_initial_downgrade.sql").read_text())
