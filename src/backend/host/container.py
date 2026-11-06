import logging
from functools import lru_cache

from acaj_ai import (
    DocumentError,
    LLMClient,
    OpenAILLMClient,
    StubLLMClient,
    parse_cv,
    read_document,
)
from openai import OpenAI
from sqlalchemy.orm import sessionmaker

from modules.cv.entities import ExtractedFact, Extraction
from modules.cv.repository import SqlCvRepository
from modules.cv.service import CvService
from shared.config import get_settings
from shared.database import get_engine
from shared.storage import S3Storage, build_s3_storage

logger = logging.getLogger(__name__)


class AcajAiCvExtractor:
    def __init__(self, client: LLMClient) -> None:
        self._client = client

    def extract(self, filename: str, data: bytes) -> Extraction:
        try:
            text = read_document(filename, data)
        except DocumentError as error:
            logger.warning("cv document unreadable reason=%s", type(error).__name__)
            return Extraction(status="FAILED", facts=[])
        result = parse_cv(text, client=self._client)
        if result.value is None:
            logger.warning("cv parse returned no value error=%s", result.error)
            return Extraction(status="FAILED", facts=[])
        facts = [
            ExtractedFact(
                kind=fact.kind,
                title=fact.title,
                organization=fact.organization,
                body=fact.body,
                confidence=fact.confidence,
                needs_review=fact.needs_review,
            )
            for fact in result.value.facts
        ]
        return Extraction(status=result.status, facts=facts)


def build_llm_client() -> LLMClient:
    settings = get_settings()
    api_key = settings.openai_api_key.get_secret_value()
    if not api_key:
        if settings.app_env == "production":
            raise RuntimeError("OPENAI_API_KEY is required in production")
        logger.warning("OPENAI_API_KEY is empty, using the rule-based stub for CV extraction")
        return StubLLMClient()
    openai = OpenAI(api_key=api_key, timeout=settings.openai_timeout_seconds, max_retries=1)
    effort = settings.openai_reasoning_effort or None
    return OpenAILLMClient(openai, settings.openai_model, effort)


@lru_cache
def get_storage() -> S3Storage:
    return build_s3_storage(get_settings())


@lru_cache
def get_cv_service() -> CvService:
    repository = SqlCvRepository(sessionmaker(bind=get_engine(), expire_on_commit=False))
    max_bytes = get_settings().cv_max_file_mb * 1024 * 1024
    return CvService(repository, AcajAiCvExtractor(build_llm_client()), get_storage(), max_bytes)
