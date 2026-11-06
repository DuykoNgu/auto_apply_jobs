from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from host.api_router import api_router
from shared.config import get_settings
from shared.errors import register_error_handlers


def create_app() -> FastAPI:
    settings = get_settings()
    docs_enabled = settings.app_env != "production"
    app = FastAPI(
        title="ACAJ API",
        version="0.1.0",
        docs_url="/api/v1/docs" if docs_enabled else None,
        openapi_url="/api/v1/openapi.json" if docs_enabled else None,
        redoc_url=None,
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
