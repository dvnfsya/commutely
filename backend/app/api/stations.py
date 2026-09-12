from collections.abc import Generator

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.exc import MultipleResultsFound, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import stations as repository
from app.db.session import get_db
from app.schemas.stations import SafetyScoreResponse, StationResponse

router = APIRouter(tags=["stations"])


def get_read_session() -> Generator[Session, None, None]:
    """Reuse the existing session lifecycle and enforce read-only transactions."""
    try:
        for session in get_db():
            session.execute(text("SET TRANSACTION READ ONLY"))
            yield session
    except HTTPException:
        raise
    except MultipleResultsFound:
        raise HTTPException(409, "Multiple Safety Score records found for this station.") from None
    except ValidationError:
        raise HTTPException(500, "Stored station or Safety Score data has an invalid format.") from None
    except (SQLAlchemyError, ValueError):
        raise HTTPException(503, "Station data service is unavailable.") from None


@router.get("/stations", response_model=list[StationResponse])
def stations(session: Session = Depends(get_read_session)):
    return [StationResponse.model_validate(row) for row in repository.list_stations(session)]


@router.get("/safety-scores", response_model=list[SafetyScoreResponse])
def safety_scores(session: Session = Depends(get_read_session)):
    return [SafetyScoreResponse.model_validate(row) for row in repository.list_scores(session)]


@router.get("/stations/{station_id}/safety-score", response_model=SafetyScoreResponse)
def station_safety_score(station_id: str, session: Session = Depends(get_read_session)):
    if not repository.station_exists(session, station_id):
        raise HTTPException(404, "Station not found.")
    row = repository.score_for_station(session, station_id)
    if row is None:
        raise HTTPException(404, "No Safety Score is available for this station.")
    return SafetyScoreResponse.model_validate(row)
