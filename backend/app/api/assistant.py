from collections.abc import Generator

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services.gemini import GeminiError, get_answer

router = APIRouter(tags=["assistant"])


def get_gemini_client() -> Generator[httpx.Client, None, None]:
    with httpx.Client(timeout=httpx.Timeout(30.0, connect=5.0), follow_redirects=False) as client:
        yield client


@router.post("/assistant", response_model=AssistantResponse)
def assistant(
    payload: AssistantRequest,
    request: Request,
    client: httpx.Client = Depends(get_gemini_client),
) -> AssistantResponse:
    try:
        return get_answer(payload, request.app.state.settings, client)
    except GeminiError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from None
