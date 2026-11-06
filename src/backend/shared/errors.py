import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

PROBLEM_JSON = "application/problem+json"


def problem(status: int, title: str, errors: list[dict[str, str]] | None = None) -> JSONResponse:
    body: dict[str, object] = {"title": title, "status": status, "traceId": uuid4().hex}
    if errors:
        body["errors"] = errors
    return JSONResponse(body, status_code=status, media_type=PROBLEM_JSON)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_failed(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"field": ".".join(str(part) for part in err["loc"][1:]), "message": err["msg"]}
            for err in exc.errors()
        ]
        return problem(422, "Validation failed", errors)

    @app.exception_handler(Exception)
    async def unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled error", exc_info=exc)
        return problem(500, "Internal server error")
