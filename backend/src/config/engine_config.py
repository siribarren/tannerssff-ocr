from functools import lru_cache
from os import environ

from sqlalchemy import Engine, create_engine

def _get_engine_sqlite():
    bd_name = environ.get("BD_NAME")
    assert bd_name is not None, "La variable de entorno BD_NAME no esta definida"
    url = f"sqlite:///{bd_name}.db"
    return create_engine(url, connect_args={"check_same_thread": False})

def _get_engine():
    from src.bd import schema

    ambiente = environ.get("AMBIENTE", "")
    if ambiente == "sqlite":
        return _get_engine_sqlite()
    else:
        raise ValueError(f"AMBIENTE invalido: {ambiente}")

@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return _get_engine()