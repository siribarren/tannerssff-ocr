from datetime import datetime

from sqlalchemy import Engine
from sqlmodel import Session, select

from src.config.engine_config import get_engine
from src.bd.schema import RequestCache
from src.llm.estructuras import TokenInfo


class RequestCacheService:
    engine: Engine

    def __init__(self, engine: Engine | None = None):
        self.engine = engine or get_engine()

    def obtener_request_cache_sql(self, model: str, request_hash: str) -> RequestCache | None:
        with Session(self.engine) as session:
            return session.exec(select(RequestCache).where(RequestCache.request_hash == request_hash).where(RequestCache.model == model)).first()
        
    def guardar_request_cache_sql(
        self, model: str, request_text: str, request_hash: str, response_text: str, token_info: TokenInfo | None, tiempo_ms: int
    ) -> RequestCache:
        with Session(self.engine) as session:
            cache_existente = session.exec(
                select(RequestCache).where(RequestCache.request_hash == request_hash).where(RequestCache.model == model)
            ).first()
            if cache_existente:
                return cache_existente
            
            cache: RequestCache = RequestCache(
                model=model,
                fecha=datetime.now(),
                request_text=request_text,
                request_hash=request_hash,
                response_text=response_text,
                tiempo_ms=tiempo_ms,
            )

            if token_info:
                cache.tokens_input = token_info.input_tokens
                cache.tokens_thoughts = token_info.thoughts_tokens
                cache.tokens_output = token_info.output_token
                cache.tokens_total = token_info.total_tokens
            session.add(cache)
            session.commit()
            session.refresh(cache)
            return cache