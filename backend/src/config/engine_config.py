from functools import lru_cache
from os import environ

from sqlalchemy import Engine, create_engine

def _get_engine_sqlite():
    bd_name = environ.get("BD_NAME")
    assert bd_name is not None, "La variable de entorno BD_NAME no esta definida"
    url = f"sqlite:///{bd_name}.db"
    return create_engine(url, connect_args={"check_same_thread": False})

def _get_engine_local() -> Engine:
    bd_host = environ.get("BD_HOST")
    assert bd_host is not None, "La variable de entorno BD_HOST no está definida"
    bd_port = environ.get("BD_PORT")
    assert bd_port is not None, "La variable de entorno BD_PORT no está definida"
    bd_user = environ.get("BD_USER")
    assert bd_user is not None, "La variable de entorno BD_USER no está definida"
    bd_pass = environ.get("BD_PASS")
    assert bd_pass is not None, "La variable de entorno BD_PASS no está definida"
    bd_name = environ.get("BD_NAME")
    assert bd_name is not None, "La variable de entorno BD_NAME no está definida"
    url = f"postgresql+psycopg2://{bd_user}:{bd_pass}@{bd_host}:{bd_port}/{bd_name}"
    return create_engine(url, pool_size=5, max_overflow=0, pool_timeout=30, pool_recycle=1800)

def _get_engine():
    from src.bd import schema

    ambiente = environ.get("AMBIENTE", "")
    if ambiente == "sqlite":
        return _get_engine_sqlite()
    elif ambiente == "local":
        return _get_engine_local()
    else:
        raise ValueError(f"AMBIENTE invalido: {ambiente}")

@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return _get_engine()