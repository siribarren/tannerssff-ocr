from datetime import date
from sqlalchemy import Index
from sqlmodel import Field, SQLModel

class RequestCache(SQLModel, table=True): # pyright: ignore[reportCallIssue]
    id: int | None = Field(default=None, primary_key=True)
    model: str = Field(max_length=50)
    fecha: date = Field()
    request_text: str = Field(default="")
    request_hash: str = Field(max_length=64)
    response_text: str = Field()
    tiempo_ms: int = Field()
    tokens_input: int = Field(default=0)
    tokens_thoughts: int = Field(default=0)
    tokens_output: int = Field(default=0)
    tokens_total: int = Field(default=0)

    __table_args__ = (Index("uq_request_cache_model_hash", "model", "request_hash", unique=True),)
