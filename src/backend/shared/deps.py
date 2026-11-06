from uuid import UUID

DEV_USER_ID = UUID("00000000-0000-4000-8000-000000000001")


def current_user_id() -> UUID:
    return DEV_USER_ID
