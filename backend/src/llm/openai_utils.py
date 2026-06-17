import hashlib
import logging

from openai import OpenAI
from openai.types.responses import Response

from src.bd.bd_request_cache import RequestCacheService
from src.llm.estructuras import TokenInfo

class OpenAiUtils:
    def __init__(self, request_cache_service: RequestCacheService | None = None):
        self.request_cache_service = request_cache_service or RequestCacheService()

    @staticmethod
    def hash_contenido_1(prompt: str) -> str:
        h = hashlib.sha256()
        h.update(prompt.encode("utf-8"))
        return h.hexdigest()

    @staticmethod
    def get_tokens_openai(response: Response) -> TokenInfo | None:
        try:
            usage = response.usage
            if usage is None:
                return None
            output_tokens_details = usage.output_tokens_details
            thoughts_tokens = output_tokens_details.reasoning_tokens if output_tokens_details else 0
            token_info = TokenInfo(
                input_tokens=usage.input_tokens,
                thoughts_tokens=thoughts_tokens,
                output_token=usage.output_tokens,
                total_tokens=usage.total_tokens
            )
            return token_info
        except Exception as e:
            logging.info(f"No se pudieron registrar los tokens de OpenAi: {e}")
            return None
        
    def obtener_request_hash(self, model_name: str, request_hash: str):
        return self.request_cache_service.obtener_request_cache_sql(model_name, request_hash)
    
    def guardar_request_hash(self, model_name: str, req_text: str, req_hash: str, res_text: str, token_info: TokenInfo, tiempo_ms: int) -> None:
        self.request_cache_service.guardar_request_cache_sql(model_name, req_text, req_hash, res_text, token_info, tiempo_ms)