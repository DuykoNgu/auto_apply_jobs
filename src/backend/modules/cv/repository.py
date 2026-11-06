from typing import cast
from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload, sessionmaker

from modules.cv.entities import AiStatus, CvFact, CvRecord, ExtractedFact, FactKind
from modules.cv.models import CvFactModel, CvModel


class SqlCvRepository:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def create_pending(self, user_id: UUID, make_primary: bool, file_key: str) -> CvRecord:
        with self._session_factory.begin() as session:
            if make_primary:
                session.execute(
                    update(CvModel)
                    .where(CvModel.user_id == user_id, CvModel.is_primary)
                    .values(is_primary=False)
                )
            cv = CvModel(
                user_id=user_id, source="UPLOAD_FILE", is_primary=make_primary, file_key=file_key
            )
            session.add(cv)
            session.flush()
            session.refresh(cv)
            return _record(cv, with_facts=False)

    def save_extraction(self, cv_id: UUID, status: AiStatus, facts: list[ExtractedFact]) -> None:
        with self._session_factory.begin() as session:
            if session.get(CvModel, cv_id) is None:
                return
            session.execute(delete(CvFactModel).where(CvFactModel.cv_id == cv_id))
            session.execute(update(CvModel).where(CvModel.id == cv_id).values(status=status))
            session.add_all(
                CvFactModel(
                    cv_id=cv_id,
                    kind=fact.kind,
                    position=position,
                    title=fact.title,
                    organization=fact.organization,
                    body=fact.body,
                    confidence=fact.confidence,
                    needs_review=fact.needs_review,
                )
                for position, fact in enumerate(facts)
            )

    def get(self, user_id: UUID, cv_id: UUID) -> CvRecord | None:
        with self._session_factory() as session:
            cv = session.scalar(
                select(CvModel)
                .where(CvModel.id == cv_id, CvModel.user_id == user_id)
                .options(selectinload(CvModel.facts))
            )
            return _record(cv, with_facts=True) if cv else None

    def list_for_user(self, user_id: UUID) -> list[CvRecord]:
        with self._session_factory() as session:
            rows = session.scalars(
                select(CvModel)
                .where(CvModel.user_id == user_id)
                .order_by(CvModel.created_at.desc())
            )
            return [_record(cv, with_facts=False) for cv in rows]


def _record(cv: CvModel, *, with_facts: bool) -> CvRecord:
    return CvRecord(
        id=cv.id,
        user_id=cv.user_id,
        status=cast(AiStatus, cv.status),
        is_primary=cv.is_primary,
        target_role=cv.target_role,
        created_at=cv.created_at,
        file_key=cv.file_key,
        facts=_facts(cv) if with_facts else [],
    )


def _facts(cv: CvModel) -> list[CvFact]:
    return [
        CvFact(
            id=fact.id,
            position=fact.position,
            kind=cast(FactKind, fact.kind),
            title=fact.title,
            organization=fact.organization,
            body=fact.body,
            confidence=float(fact.confidence) if fact.confidence is not None else None,
            needs_review=fact.needs_review,
        )
        for fact in cv.facts
    ]
