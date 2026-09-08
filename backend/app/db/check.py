"""Read-only connectivity and PostGIS extension check: python -m app.db.check."""

import json

from sqlalchemy import Engine, text

from app.core.config import Settings
from app.db.session import create_database_engine


def check_database(engine: Engine) -> dict:
    with engine.connect() as connection:
        connection.execute(text("SET TRANSACTION READ ONLY"))
        if connection.execute(text("SELECT 1")).scalar_one() != 1:
            raise RuntimeError("Database connectivity check failed.")
        extension = connection.execute(
            text(
                "SELECT e.extversion AS version, n.nspname AS schema "
                "FROM pg_catalog.pg_extension e "
                "JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace "
                "WHERE e.extname = :name"
            ),
            {"name": "postgis"},
        ).mappings().one_or_none()
    return {
        "database": "ok",
        "postgis": {"enabled": extension is not None, **dict(extension or {})},
    }


def main() -> int:
    engine = None
    try:
        settings = Settings()
        if not settings.database_url.get_secret_value().strip():
            print(json.dumps({"database": "unconfigured", "postgis": "unverified"}))
            return 1
        engine = create_database_engine(settings)
        print(json.dumps(check_database(engine)))
        return 0
    except Exception:
        # Driver exceptions can contain connection details; never print them here.
        print(json.dumps({"database": "error", "postgis": "unverified"}))
        return 1
    finally:
        if engine is not None:
            engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
