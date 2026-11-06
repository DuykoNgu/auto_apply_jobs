from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.database import Base

AI_STATUS = Enum("PENDING", "READY", "NEEDS_REVIEW", "FAILED", name="ai_status", create_type=False)
FACT_KIND = Enum(
    "PROFILE",
    "SUMMARY",
    "EXPERIENCE",
    "PROJECT",
    "EDUCATION",
    "CERTIFICATE",
    "SKILL_LIST",
    name="fact_kind",
    create_type=False,
)
CV_SOURCE = Enum(
    "UPLOAD_FILE",
    "UPLOAD_IMAGE",
    "TEMPLATE_MANUAL",
    "AI_GENERATED",
    name="cv_source",
    create_type=False,
)


class CvModel(Base):
    __tablename__ = "cvs"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[UUID] = mapped_column(Uuid)
    source: Mapped[str] = mapped_column(CV_SOURCE)
    status: Mapped[str] = mapped_column(AI_STATUS, server_default="PENDING")
    is_primary: Mapped[bool] = mapped_column(Boolean, server_default="false")
    file_key: Mapped[str | None] = mapped_column(Text)
    target_role: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    facts: Mapped[list["CvFactModel"]] = relationship(
        order_by="CvFactModel.position", cascade="all, delete-orphan", lazy="raise"
    )


class CvFactModel(Base):
    __tablename__ = "cv_facts"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, server_default=func.gen_random_uuid())
    cv_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("cvs.id"))
    kind: Mapped[str] = mapped_column(FACT_KIND)
    position: Mapped[int] = mapped_column(SmallInteger)
    title: Mapped[str | None] = mapped_column(String(200))
    organization: Mapped[str | None] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float | None] = mapped_column(Numeric(3, 2))
    needs_review: Mapped[bool] = mapped_column(Boolean, server_default="false")
