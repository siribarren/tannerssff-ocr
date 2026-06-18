from datetime import date
from pydantic import BaseModel, Field

class TokenInfo(BaseModel):
    input_tokens: int
    thoughts_tokens: int
    output_token: int
    total_tokens: int

class ConciliacionResponse(BaseModel):
    fecha: date | None = Field(default=None, description="Fecha de la transferencia en formato YYYY-MM-DD.")
    nombre: str | None = Field(default=None, description="Nombre de la persona que hace la transferencia.")
    rut: str | None = Field(default=None, description="RUT de la persona sin puntos y con guion para el digito verificador")
    monto: int | None = Field(default=None, description="Monto de la transferencia, solo el número entero sin símbolos ni separadores")