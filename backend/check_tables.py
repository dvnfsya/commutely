from sqlalchemy import create_engine, text
from app.core.config import Settings

settings = Settings()

engine = create_engine(
    settings.database_url.get_secret_value()
)

with engine.connect() as connection:
    result = connection.execute(
        text("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
        """)
    )

    for row in result:
        print(f"{row[0]}.{row[1]}")