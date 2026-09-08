from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Report application liveness without checking external services."""
    return {"status": "ok"}
