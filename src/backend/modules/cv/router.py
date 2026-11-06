from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Response, UploadFile

from modules.cv.schemas import CvOut, CvSummaryOut
from modules.cv.service import CvService
from shared.deps import current_user_id

CurrentUser = Annotated[UUID, Depends(current_user_id)]


def create_router(get_service: Callable[[], CvService]) -> APIRouter:
    router = APIRouter(prefix="/cvs", tags=["CVs"])
    Service = Annotated[CvService, Depends(get_service)]  # noqa: N806

    @router.get("", operation_id="listCvs", response_model=list[CvSummaryOut])
    def list_cvs(user_id: CurrentUser, service: Service) -> list[CvSummaryOut]:
        return [CvSummaryOut.model_validate(cv) for cv in service.list_for_user(user_id)]

    @router.post(
        "",
        operation_id="uploadCv",
        status_code=202,
        response_model=CvSummaryOut,
    )
    async def upload_cv(
        user_id: CurrentUser,
        service: Service,
        background: BackgroundTasks,
        file: Annotated[UploadFile, File()],
        make_primary: Annotated[bool, Form(alias="makePrimary")] = True,
    ) -> CvSummaryOut:
        filename = file.filename or ""
        data = await file.read(service.max_bytes + 1)
        cv = service.upload(user_id, filename, data, make_primary)
        background.add_task(service.process, cv.id, filename, data)
        return CvSummaryOut.model_validate(cv)

    @router.get("/{cv_id}", operation_id="getCv", response_model=CvOut)
    def get_cv(cv_id: UUID, user_id: CurrentUser, service: Service) -> CvOut:
        return CvOut.model_validate(service.get(user_id, cv_id))

    @router.get("/{cv_id}/file", operation_id="getCvOriginalFile", response_class=Response)
    def get_cv_original_file(cv_id: UUID, user_id: CurrentUser, service: Service) -> Response:
        original = service.get_original(user_id, cv_id)
        return Response(
            original.data,
            media_type=original.content_type,
            headers={"Content-Disposition": "inline", "X-Content-Type-Options": "nosniff"},
        )

    return router
