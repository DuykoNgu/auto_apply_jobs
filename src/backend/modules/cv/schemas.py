from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from modules.cv.entities import AiStatus, FactKind


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class CvSummaryOut(CamelModel):
    id: UUID
    source: str = "UPLOAD_FILE"
    status: AiStatus
    is_primary: bool
    target_role: str | None
    created_at: datetime
    original_file_type: str | None


class CvFactOut(CamelModel):
    id: UUID
    position: int
    kind: FactKind
    title: str | None
    organization: str | None
    body: str
    confidence: float | None
    needs_review: bool


class CvOut(CvSummaryOut):
    facts: list[CvFactOut]
