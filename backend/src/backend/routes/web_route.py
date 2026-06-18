import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from src.llm.estructuras import ConciliacionResponse
from src.backend.web_service import (
    ArchivoVacioError,
    MimeNoSoportadoError,
    WebService,
    get_web_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sistema"])


@router.post("/procesar-comprobante", operation_id="procesarComprobante", response_model=ConciliacionResponse)
async def procesar_comprobante(
    imagen: UploadFile = File(...),
    service: WebService = Depends(get_web_service),
) -> ConciliacionResponse:
    content = await imagen.read()
    try:
        return service.procesar_comprobante(content, imagen.content_type)
    except MimeNoSoportadoError as e:
        raise HTTPException(status_code=415, detail=f"Tipo de archivo no soportado: {e}")
    except ArchivoVacioError:
        raise HTTPException(status_code=400, detail="El archivo esta vacio.")
    except Exception as e:
        logger.error("Error procesando comprobante: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
