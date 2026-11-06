import logging
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID, uuid4

from modules.cv.entities import AiStatus, CvRecord, ExtractedFact, Extraction
from modules.cv.errors import (
    CvFileNotFoundError,
    CvNotFoundError,
    FileTooLargeError,
    UnsupportedFileError,
)
from shared.storage import ObjectNotFoundError

logger = logging.getLogger(__name__)

SIGNATURES = {"pdf": b"%PDF", "docx": b"PK\x03\x04"}
CONTENT_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class CvRepository(Protocol):
    def create_pending(self, user_id: UUID, make_primary: bool, file_key: str) -> CvRecord: ...

    def save_extraction(
        self, cv_id: UUID, status: AiStatus, facts: list[ExtractedFact]
    ) -> None: ...

    def get(self, user_id: UUID, cv_id: UUID) -> CvRecord | None: ...

    def list_for_user(self, user_id: UUID) -> list[CvRecord]: ...


class FileStorage(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> None: ...

    def get(self, key: str) -> bytes: ...


@dataclass(frozen=True)
class OriginalFile:
    data: bytes
    content_type: str


class CvExtractor(Protocol):
    def extract(self, filename: str, data: bytes) -> Extraction: ...


class CvService:
    def __init__(
        self,
        repository: CvRepository,
        extractor: CvExtractor,
        storage: FileStorage,
        max_bytes: int,
    ) -> None:
        self._repository = repository
        self._extractor = extractor
        self._storage = storage
        self.max_bytes = max_bytes

    def upload(self, user_id: UUID, filename: str, data: bytes, make_primary: bool) -> CvRecord:
        extension = self._validate(filename, data)
        key = f"cvs/{user_id}/{uuid4()}.{extension}"
        self._storage.put(key, data, CONTENT_TYPES[extension])
        return self._repository.create_pending(user_id, make_primary, key)

    def process(self, cv_id: UUID, filename: str, data: bytes) -> None:
        logger.info("cv extraction start cv_id=%s bytes=%d", cv_id, len(data))
        try:
            extraction = self._extractor.extract(filename, data)
        except Exception:
            logger.exception("cv extraction crashed cv_id=%s", cv_id)
            extraction = Extraction(status="FAILED", facts=[])
        self._repository.save_extraction(cv_id, extraction.status, extraction.facts)
        log = logger.warning if extraction.status == "FAILED" else logger.info
        log(
            "cv extraction saved cv_id=%s status=%s facts=%d",
            cv_id,
            extraction.status,
            len(extraction.facts),
        )

    def get(self, user_id: UUID, cv_id: UUID) -> CvRecord:
        cv = self._repository.get(user_id, cv_id)
        if cv is None:
            raise CvNotFoundError
        return cv

    def get_original(self, user_id: UUID, cv_id: UUID) -> OriginalFile:
        cv = self.get(user_id, cv_id)
        if cv.file_key is None or cv.original_file_type not in CONTENT_TYPES:
            raise CvFileNotFoundError
        try:
            data = self._storage.get(cv.file_key)
        except ObjectNotFoundError as error:
            raise CvFileNotFoundError from error
        return OriginalFile(data, CONTENT_TYPES[cv.original_file_type])

    def list_for_user(self, user_id: UUID) -> list[CvRecord]:
        return self._repository.list_for_user(user_id)

    def _validate(self, filename: str, data: bytes) -> str:
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        signature = SIGNATURES.get(extension)
        if signature is None or not data.startswith(signature):
            raise UnsupportedFileError
        if len(data) > self.max_bytes:
            raise FileTooLargeError
        return extension
