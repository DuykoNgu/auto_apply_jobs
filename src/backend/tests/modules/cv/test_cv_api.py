import io
import logging
from collections.abc import Iterator
from uuid import UUID, uuid4

import pytest
from acaj_ai import StubLLMClient
from docx import Document
from fastapi.testclient import TestClient

from host.container import AcajAiCvExtractor, get_cv_service
from host.main import app
from modules.cv.entities import Extraction
from modules.cv.service import CvService
from shared.deps import current_user_id
from tests.fakes.cv_repository import InMemoryCvRepository
from tests.fakes.file_storage import InMemoryFileStorage

CV_LINES = [
    "An Nguyen",
    "Backend Developer",
    "an@example.com 0912 345 678",
    "Experience",
    "Intern - ABC",
    "Built REST APIs",
    "Skills",
    "Python, SQL",
]
DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class CrashingExtractor:
    def extract(self, filename: str, data: bytes) -> Extraction:
        raise RuntimeError("boom")


def docx_bytes(lines: list[str]) -> bytes:
    buffer = io.BytesIO()
    document = Document()
    for line in lines:
        document.add_paragraph(line)
    document.save(buffer)
    return buffer.getvalue()


def use_service(extractor: object, max_bytes: int = 1_000_000) -> None:
    storage = InMemoryFileStorage()
    service = CvService(InMemoryCvRepository(), extractor, storage, max_bytes)  # type: ignore[arg-type]
    app.state.storage = storage
    app.dependency_overrides[get_cv_service] = lambda: service


@pytest.fixture(autouse=True)
def reset() -> Iterator[None]:
    use_service(AcajAiCvExtractor(StubLLMClient()))
    yield
    app.dependency_overrides.clear()


def upload(name: str, data: bytes, client: TestClient | None = None) -> object:
    return (client or TestClient(app)).post(
        "/api/v1/cvs", files={"file": (name, data, DOCX_TYPE)}, data={"makePrimary": "true"}
    )


def test_upload_docx_then_get_extracted_facts() -> None:
    client = TestClient(app)
    response = upload("cv.docx", docx_bytes(CV_LINES), client)
    assert response.status_code == 202  # type: ignore[attr-defined]
    created = response.json()  # type: ignore[attr-defined]
    assert created["isPrimary"] is True

    cv = client.get(f"/api/v1/cvs/{created['id']}").json()
    assert cv["status"] == "READY"
    assert [f["kind"] for f in cv["facts"]] == ["PROFILE", "EXPERIENCE", "SKILL_LIST"]
    assert "an@example.com" in cv["facts"][0]["body"]
    assert cv["facts"][0]["needsReview"] is False
    assert [c["id"] for c in client.get("/api/v1/cvs").json()] == [created["id"]]


def test_low_confidence_marks_needs_review() -> None:
    client = TestClient(app)
    created = upload("cv.docx", docx_bytes(["Jane Doe", "Analyst"]), client).json()  # type: ignore[attr-defined]
    assert client.get(f"/api/v1/cvs/{created['id']}").json()["status"] == "NEEDS_REVIEW"


def test_unreadable_document_fails_cleanly() -> None:
    client = TestClient(app)
    created = upload("cv.docx", docx_bytes([]), client).json()  # type: ignore[attr-defined]
    cv = client.get(f"/api/v1/cvs/{created['id']}").json()
    assert cv["status"] == "FAILED"
    assert cv["facts"] == []


def test_crashing_extractor_marks_failed_and_logs_the_traceback(
    caplog: pytest.LogCaptureFixture,
) -> None:
    use_service(CrashingExtractor())
    client = TestClient(app)
    with caplog.at_level(logging.INFO):
        created = upload("cv.docx", docx_bytes(CV_LINES), client).json()  # type: ignore[attr-defined]
    assert client.get(f"/api/v1/cvs/{created['id']}").json()["status"] == "FAILED"

    crash = next(r for r in caplog.records if "cv extraction crashed" in r.getMessage())
    assert created["id"] in crash.getMessage()
    assert crash.exc_info is not None
    assert "cv extraction saved" in caplog.text


@pytest.mark.parametrize(
    ("name", "data"),
    [
        ("cv.png", b"\x89PNG"),
        ("cv.exe", b"MZ"),
        ("cv.docx", b"%PDF-fake"),
        ("noext", b"PK\x03\x04"),
    ],
)
def test_unsupported_files_are_rejected(name: str, data: bytes) -> None:
    response = upload(name, data)
    assert response.status_code == 400  # type: ignore[attr-defined]
    assert response.headers["content-type"] == "application/problem+json"  # type: ignore[attr-defined]


def test_oversized_file_is_413() -> None:
    use_service(AcajAiCvExtractor(StubLLMClient()), max_bytes=100)
    assert upload("cv.docx", docx_bytes(CV_LINES)).status_code == 413  # type: ignore[attr-defined]


def test_missing_file_is_422() -> None:
    assert TestClient(app).post("/api/v1/cvs").status_code == 422


def test_other_users_cv_is_404_and_unknown_id_is_404() -> None:
    client = TestClient(app)
    created = upload("cv.docx", docx_bytes(CV_LINES), client).json()  # type: ignore[attr-defined]
    stranger: UUID = uuid4()
    app.dependency_overrides[current_user_id] = lambda: stranger
    assert client.get(f"/api/v1/cvs/{created['id']}").status_code == 404
    assert client.get(f"/api/v1/cvs/{uuid4()}").status_code == 404
    assert client.get("/api/v1/cvs").json() == []


def test_original_file_is_stored_and_served_back_to_its_owner() -> None:
    client = TestClient(app)
    data = docx_bytes(CV_LINES)
    created = upload("cv.docx", data, client).json()  # type: ignore[attr-defined]
    assert created["originalFileType"] == "docx"

    response = client.get(f"/api/v1/cvs/{created['id']}/file")
    assert response.status_code == 200
    assert response.content == data
    assert response.headers["content-type"].startswith("application/vnd.openxmlformats")
    assert response.headers["x-content-type-options"] == "nosniff"


def test_original_file_of_another_user_or_unknown_cv_is_404() -> None:
    client = TestClient(app)
    created = upload("cv.docx", docx_bytes(CV_LINES), client).json()  # type: ignore[attr-defined]
    app.dependency_overrides[current_user_id] = lambda: uuid4()
    assert client.get(f"/api/v1/cvs/{created['id']}/file").status_code == 404
    assert client.get(f"/api/v1/cvs/{uuid4()}/file").status_code == 404


def test_original_file_missing_from_storage_is_404() -> None:
    client = TestClient(app)
    created = upload("cv.docx", docx_bytes(CV_LINES), client).json()  # type: ignore[attr-defined]
    app.state.storage.objects.clear()
    assert client.get(f"/api/v1/cvs/{created['id']}/file").status_code == 404


def test_upload_is_not_accepted_when_storage_fails() -> None:
    class BrokenStorage:
        def put(self, key: str, data: bytes, content_type: str) -> None:
            raise OSError("storage down")

        def get(self, key: str) -> bytes:
            raise OSError("storage down")

    service = CvService(
        InMemoryCvRepository(), AcajAiCvExtractor(StubLLMClient()), BrokenStorage(), 10**6
    )
    app.dependency_overrides[get_cv_service] = lambda: service
    response = TestClient(app, raise_server_exceptions=False).post(
        "/api/v1/cvs", files={"file": ("cv.docx", docx_bytes(CV_LINES), DOCX_TYPE)}
    )
    assert response.status_code == 500
