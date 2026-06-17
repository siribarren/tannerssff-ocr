import hashlib
import logging
import time
from os import environ
from pathlib import Path
from uuid import uuid4
from functools import lru_cache

from google.cloud import documentai

from src.bd.bd_request_cache import RequestCacheService
from src.gcp.documentai_service import DocumentAIService
from src.llm.openai_conciliacion import OpenAiConciliacionService
from src.llm.estructuras import ConciliacionResponse

logger = logging.getLogger(__name__)

MIME_PERMITIDOS = {"application/pdf", "image/jpeg", "image/png"}
OUTPUT_DIR = Path(environ.get("BASE_DIR", ".")) / "output"


class MimeNoSoportadoError(Exception):
    pass


class ArchivoVacioError(Exception):
    pass


class WebService:
    def __init__(self):
        self.documentai = DocumentAIService()
        self.conciliacion = OpenAiConciliacionService()
        self.cache = RequestCacheService()

    def procesar_comprobante(self, content: bytes, content_type: str) -> ConciliacionResponse:
        if content_type not in MIME_PERMITIDOS:
            raise MimeNoSoportadoError(content_type)
        if not content:
            raise ArchivoVacioError()

        texto = self._obtener_texto(content, content_type)
        return self.conciliacion.obtener_conciliacion(texto)

    def _obtener_texto(self, content: bytes, content_type: str) -> str:
        model = f"documentai:{self.documentai.processor_id}"
        request_hash = hashlib.sha256(content).hexdigest()

        cached = self.cache.obtener_request_cache_sql(model, request_hash)
        if cached:
            logger.info("Texto OCR obtenido desde cache (hash=%s)", request_hash)
            return cached.response_text

        start = time.time()
        document = self.documentai.procesar(content, content_type)
        tiempo_ms = int((time.time() - start) * 1000)
        self._guardar_resultado(document)
        self.cache.guardar_request_cache_sql(
            model,
            f"DocumentAI OCR {content_type} sha256={request_hash}",
            request_hash,
            document.text,
            None,
            tiempo_ms,
        )
        return document.text

    def _guardar_resultado(self, document: documentai.Document) -> None:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        nombre = uuid4().hex
        (OUTPUT_DIR / f"{nombre}.json").write_text(
            documentai.Document.to_json(document), encoding="utf-8"
        )
        (OUTPUT_DIR / f"{nombre}.txt").write_text(document.text, encoding="utf-8")
        logger.info("Resultado guardado: %s/%s.{json,txt}", OUTPUT_DIR, nombre)


@lru_cache
def get_web_service() -> WebService:
    return WebService()
