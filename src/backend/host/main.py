import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from host.api_router import api_router
from host.container import get_storage
from host.dev_user import ensure_dev_user
from shared.config import get_settings
from shared.database import get_engine
from shared.errors import register_error_handlers


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if get_settings().app_env == "development":
        with Session(get_engine()) as session:
            ensure_dev_user(session)
        get_storage().ensure_bucket()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    docs_enabled = settings.app_env != "production"
    app = FastAPI(
        title="ACAJ API",
        version="0.1.0",
        docs_url="/api/v1/docs" if docs_enabled else None,
        openapi_url="/api/v1/openapi.json" if docs_enabled else None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)
    register_error_handlers(app)
    return app


app = create_app()
