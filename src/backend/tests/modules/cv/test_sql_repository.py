from collections.abc import Iterator
from uuid import UUID, uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

from modules.cv.entities import ExtractedFact
from modules.cv.repository import SqlCvRepository
from shared.database import get_engine


@pytest.fixture
def user_id() -> Iterator[UUID]:
    factory = sessionmaker(bind=get_engine())
    new_id = uuid4()
    try:
        with factory.begin() as session:
            session.execute(
                text(
                    "INSERT INTO app_users (id, email, password_hash, full_name) "
                    "VALUES (:id, :email, '!', 'Test')"
                ),
                {"id": new_id, "email": f"{new_id}@test.local"},
            )
    except OperationalError:
        pytest.skip("postgres is not reachable")
    yield new_id
    with factory.begin() as session:
        session.execute(text("DELETE FROM app_users WHERE id = :id"), {"id": new_id})


def test_create_save_get_round_trip(user_id: UUID) -> None:
    repository = SqlCvRepository(sessionmaker(bind=get_engine(), expire_on_commit=False))
    pending = repository.create_pending(user_id, make_primary=True, file_key="cvs/x/y.pdf")
    assert pending.status == "PENDING"
    assert pending.original_file_type == "pdf"

    fact = ExtractedFact("PROFILE", "An", None, "Dev", 0.95, False)
    repository.save_extraction(pending.id, "READY", [fact])

    loaded = repository.get(user_id, pending.id)
    assert loaded is not None
    assert loaded.status == "READY"
    assert [(f.kind, f.title, f.confidence) for f in loaded.facts] == [("PROFILE", "An", 0.95)]
    assert repository.get(uuid4(), pending.id) is None
    assert [cv.id for cv in repository.list_for_user(user_id)] == [pending.id]


def test_saving_extraction_twice_replaces_the_facts(user_id: UUID) -> None:
    repository = SqlCvRepository(sessionmaker(bind=get_engine(), expire_on_commit=False))
    pending = repository.create_pending(user_id, make_primary=False, file_key="cvs/x/z.pdf")
    first = ExtractedFact("PROFILE", "Old", None, "old", 0.9, False)
    second = ExtractedFact("PROFILE", "New", None, "new", 0.9, False)

    repository.save_extraction(pending.id, "READY", [first])
    repository.save_extraction(pending.id, "NEEDS_REVIEW", [second])

    loaded = repository.get(user_id, pending.id)
    assert loaded is not None
    assert loaded.status == "NEEDS_REVIEW"
    assert [fact.title for fact in loaded.facts] == ["New"]
