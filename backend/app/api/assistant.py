from collections.abc import Generator

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import MultipleResultsFound, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import stations as repository
from app.db.session import get_db
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services.gemini import GeminiError, get_answer

router = APIRouter(tags=["assistant"])


def get_gemini_client() -> Generator[httpx.Client, None, None]:
    with httpx.Client(timeout=httpx.Timeout(30.0, connect=5.0), follow_redirects=False) as client:
        yield client


def get_read_session() -> Generator[Session, None, None]:
    try:
        for session in get_db():
            session.execute(text("SET TRANSACTION READ ONLY"))
            yield session
    except MultipleResultsFound:
        raise HTTPException(409, "Multiple Safety Score records found for this station.") from None
    except SQLAlchemyError:
        raise HTTPException(503, "Station data service is unavailable.") from None


@router.post("/assistant", response_model=AssistantResponse)
def assistant(
    payload: AssistantRequest,
    request: Request,
    client: httpx.Client = Depends(get_gemini_client),
    session: Session = Depends(get_read_session),
) -> AssistantResponse:
    context = dict(payload.context)

    if payload.station_id:
        if not repository.station_exists(session, payload.station_id):
            raise HTTPException(404, "Station not found.")

        score = repository.score_for_station(session, payload.station_id)
        if score is None:
            context["station_safety"] = {
                "station_id": payload.station_id,
                "available": False,
            }
        else:
            context["station_safety"] = {
                "station_id": str(score["station_id"]),
                "station_name": str(score["name"]),
                "safety_score": float(score["safety_score"]),
                "category": str(score["category"]),
                "rank": int(score["rank"]),
                "available": True,
            }

    gemini_payload = AssistantRequest(
        question=payload.question,
        context=context,
    )

    try:
        return get_answer(gemini_payload, request.app.state.settings, client)
    except GeminiError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from None
