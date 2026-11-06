from typing import Literal

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from shared.database import get_session

router = APIRouter(tags=["Health"])


class Health(BaseModel):
    status: Literal["ok", "degraded"]
    database: Literal["ok", "down"]


@router.get("/health", operation_id="getHealth", response_model=Health)
def get_health(response: Response, session: Session = Depends(get_session)) -> Health:  # noqa: B008
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        response.status_code = 503
        return Health(status="degraded", database="down")
    return Health(status="ok", database="ok")
