from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import URL, Engine, create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.orm import Session

from app.core.config import Settings


def get_database_url(settings: Settings) -> URL:
    raw_url = settings.database_url.get_secret_value().strip()
    if not raw_url:
        raise ValueError("DATABASE_URL is not configured.")
    try:
        url = make_url(raw_url)
        if url.drivername not in {"postgres", "postgresql", "postgresql+psycopg"}:
            raise ValueError
        if not url.host or not url.database:
            raise ValueError
    except (ArgumentError, ValueError, TypeError):
        raise ValueError("DATABASE_URL must be a valid PostgreSQL URI.") from None
    # Supabase URIs use postgresql://; select the installed psycopg 3 driver.
    url = url.set(drivername="postgresql+psycopg")
    if "sslmode" not in url.query:
        url = url.update_query_dict({"sslmode": "require"})
    return url


def create_database_engine(settings: Settings) -> Engine:
    return create_engine(
        get_database_url(settings),
        pool_pre_ping=True,
        echo=False,
        hide_parameters=True,
        connect_args={"connect_timeout": 10, "prepare_threshold": None},
    )


@lru_cache
def get_engine() -> Engine:
    """Create the engine lazily; health and application startup remain independent."""
    return create_database_engine(Settings())


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency. Callers commit explicitly; close rolls back pending work."""
    with Session(get_engine()) as session:
        yield session
