from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv

from alembic import context

# Cargar variables de entorno (mismo .env que usa la app) antes de tocar el engine.
env_file = Path(__file__).resolve().parent.parent / ".env-desarrollo"
load_dotenv(env_file)

from sqlmodel import SQLModel

from src.bd import schema  # noqa: F401  -- registra las tablas en SQLModel.metadata
from src.config.engine_config import get_engine

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de los modelos SQLModel para autogenerate.
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = str(get_engine().url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
