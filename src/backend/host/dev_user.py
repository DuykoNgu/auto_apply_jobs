from sqlalchemy import text
from sqlalchemy.orm import Session

from shared.deps import DEV_USER_ID


def ensure_dev_user(session: Session) -> None:
    session.execute(
        text(
            "INSERT INTO app_users (id, email, password_hash, full_name) "
            "VALUES (:id, 'dev@acaj.local', '!', 'Dev User') ON CONFLICT (id) DO NOTHING"
        ),
        {"id": DEV_USER_ID},
    )
    session.commit()
