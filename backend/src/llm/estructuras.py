from datetime import date
from pydantic import BaseModel

class TokenInfo(BaseModel):
    input_tokens: int
    thoughts_tokens: int
    output_token: int
    total_tokens: int

class ConciliacionResponse(BaseModel):
    fecha: date | None = None
    monto: int | None = None
    emisor: str | None = None
    receptor: str | None = None