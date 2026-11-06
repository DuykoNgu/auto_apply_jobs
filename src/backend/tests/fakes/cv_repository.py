from datetime import UTC, datetime
from uuid import UUID, uuid4

from modules.cv.entities import AiStatus, CvFact, CvRecord, ExtractedFact


class InMemoryCvRepository:
    def __init__(self) -> None:
        self.cvs: dict[UUID, CvRecord] = {}

    def create_pending(self, user_id: UUID, make_primary: bool, file_key: str) -> CvRecord:
        cv = CvRecord(
            uuid4(), user_id, "PENDING", make_primary, None, datetime.now(UTC), file_key, []
        )
        self.cvs[cv.id] = cv
        return cv

    def save_extraction(self, cv_id: UUID, status: AiStatus, facts: list[ExtractedFact]) -> None:
        old = self.cvs[cv_id]
        saved = [
            CvFact(
                uuid4(), i, f.kind, f.title, f.organization, f.body, f.confidence, f.needs_review
            )
            for i, f in enumerate(facts)
        ]
        self.cvs[cv_id] = CvRecord(
            old.id,
            old.user_id,
            status,
            old.is_primary,
            old.target_role,
            old.created_at,
            old.file_key,
            saved,
        )

    def get(self, user_id: UUID, cv_id: UUID) -> CvRecord | None:
        cv = self.cvs.get(cv_id)
        return cv if cv and cv.user_id == user_id else None

    def list_for_user(self, user_id: UUID) -> list[CvRecord]:
        return [cv for cv in self.cvs.values() if cv.user_id == user_id]
