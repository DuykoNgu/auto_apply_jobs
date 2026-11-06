from fastapi import APIRouter

from host import health
from host.container import get_cv_service
from modules.cv.router import create_router as create_cv_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(create_cv_router(get_cv_service))
