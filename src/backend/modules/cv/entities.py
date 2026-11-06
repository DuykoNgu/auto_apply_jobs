from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

AiStatus = Literal["PENDING", "READY", "NEEDS_REVIEW", "FAILED"]
FactKind = Literal[
    "PROFILE", "SUMMARY", "EXPERIENCE", "PROJECT", "EDUCATION", "CERTIFICATE", "SKILL_LIST"
]


@dataclass(frozen=True)
class ExtractedFact:
    kind: FactKind
    title: str | None
    organization: str | None
    body: str
    confidence: float
    needs_review: bool


@dataclass(frozen=True)
class Extraction:
    status: AiStatus
    facts: list[ExtractedFact]


@dataclass(frozen=True)
class CvFact:
    id: UUID
    position: int
    kind: FactKind
    title: str | None
    organization: str | None
    body: str
    confidence: float | None
    needs_review: bool


@dataclass(frozen=True)
class CvRecord:
    id: UUID
    user_id: UUID
    status: AiStatus
    is_primary: bool
    target_role: str | None
    created_at: datetime
    file_key: str | None
    facts: list[CvFact]

    @property
    def original_file_type(self) -> str | None:
        return self.file_key.rsplit(".", 1)[-1] if self.file_key else None
