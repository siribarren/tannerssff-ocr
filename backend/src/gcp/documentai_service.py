import json
import logging
from os import environ
from pathlib import Path

from google.api_core.client_options import ClientOptions
from google.cloud import documentai

logger = logging.getLogger(__name__)


class DocumentAIService:
    project_id: str
    location: str
    processor_id: str
    _client: documentai.DocumentProcessorServiceClient
    def __init__(self):
        self.project_id = environ.get("GCP_PROJECT_ID")
        assert self.project_id is not None, "GCP_PROJECT_ID no esta configurada."

        self.location = environ.get("DOCAI_LOCATION")
        assert self.location is not None, "DOCAI_LOCATION no esta configurada."

        self.processor_id = environ.get("DOCAI_PROCESSOR_ID")
        assert self.processor_id is not None, "DOCAI_PROCESSOR_ID no esta configurada."

        credentials_path = environ.get("GCP_CREDENTIALS_PATH", None)
        assert credentials_path is not None, "GCP_CREDENTIALS_PATH no esta configurada."

        client_options = ClientOptions(api_endpoint=f"{self.location}-documentai.googleapis.com")
        self._client = self.get_document_ai_client(credentials_path, client_options)

    @property
    def processor_name(self) -> str:
        """Resource name del processor."""
        return self._client.processor_path(
            self.project_id, self.location, self.processor_id
        )

    def procesar(
        self, content: bytes, mime_type: str = "image/jpeg"
    ) -> documentai.Document:
        """Envia el archivo a Document AI y devuelve el Document resultante."""
        request = documentai.ProcessRequest(
            name=self.processor_name,
            raw_document=documentai.RawDocument(content=content, mime_type=mime_type),
        )
        logger.info("Procesando documento con %s", self.processor_name)
        result = self._client.process_document(request=request)
        return result.document

    @staticmethod
    def get_document_ai_client(
        credentials_path: str, client_options: ClientOptions
    ) -> documentai.DocumentProcessorServiceClient:
        filename = Path(credentials_path)
        sa_txt = filename.read_text()
        sa_json = json.loads(sa_txt)
        return documentai.DocumentProcessorServiceClient.from_service_account_info(
            sa_json, client_options=client_options
        )