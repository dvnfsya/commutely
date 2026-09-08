from alembic import context
from geoalchemy2 import alembic_helpers

from app.core.config import Settings
from app.db.base import Base
from app.db.session import create_database_engine, get_database_url
from app import models  # noqa: F401 -- register models with Base.metadata


target_metadata = Base.metadata


def include_object(obj, name, type_, reflected, compare_to):
    # Never propose dropping existing Supabase/extension tables not owned by us.
    if type_ == "table" and reflected and compare_to is None:
        return False
    return alembic_helpers.include_object(obj, name, type_, reflected, compare_to)


def run_migrations_offline():
    context.configure(
        url=get_database_url(Settings()),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = create_database_engine(Settings())
    try:
        with engine.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                include_object=include_object,
                render_item=alembic_helpers.render_item,
            )
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
