import logging
from functools import lru_cache
from os import environ
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from google.cloud import documentai

from src.gcp.documentai_service import DocumentAIService

logger = logging.getLogger(__name__)

router = APIRouter()

MIME_PERMITIDOS = {"application/pdf", "image/jpeg", "image/png"}
OUTPUT_DIR = Path(environ.get("BASE_DIR", ".")) / "output"


@lru_cache
def get_documentai_service() -> DocumentAIService:
    return DocumentAIService()


@router.post("/procesar-comprobante")
async def procesar_comprobante(
    imagen: UploadFile = File(...),
    service: DocumentAIService = Depends(get_documentai_service),
):
    if imagen.content_type not in MIME_PERMITIDOS:
        raise HTTPException(
            status_code=415, detail=f"Tipo de archivo no soportado: {imagen.content_type}"
        )

    content = await imagen.read()
    if not content:
        raise HTTPException(status_code=400, detail="El archivo esta vacio.")

    try:
        document = service.procesar(content, imagen.content_type)
    except Exception as e:
        logger.error("Error procesando documento: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

    _guardar_resultado(document)
    return {"text": document.text}


def _guardar_resultado(document: documentai.Document) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    nombre = uuid4().hex
    (OUTPUT_DIR / f"{nombre}.json").write_text(
        documentai.Document.to_json(document), encoding="utf-8"
    )
    (OUTPUT_DIR / f"{nombre}.txt").write_text(document.text, encoding="utf-8")
    logger.info("Resultado guardado: %s/%s.{json,txt}", OUTPUT_DIR, nombre)
