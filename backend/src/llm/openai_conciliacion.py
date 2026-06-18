import logging
import time

from openai import OpenAI
from openai.types.responses import EasyInputMessageParam, Response, ResponseInputTextContentParam

from src.config.llm_config import LlmConfig, get_llm_config
from src.llm.estructuras import TokenInfo, ConciliacionResponse
from src.llm.openai_utils import OpenAiUtils
from src.utils.timer import my_timer

class OpenAiConciliacionService:
    def __init__(self):
        llm_config: LlmConfig = get_llm_config()
        self.client = OpenAI(api_key=llm_config.openai_api_key)
        self.model_name = llm_config.openai_model
        logging.info(f"OpenAIConciliacionService inicializado con modelo: {self.model_name}")
        self.openai_utils = OpenAiUtils(None)

    @my_timer("OpenAIConciliacionService.obtener_conciliacion")
    def obtener_conciliacion(self, texto: str) -> ConciliacionResponse:
        try:
            user_prompt_str = self.get_prompt(texto)
            request_text = f"Prompt: {user_prompt_str}"
            request_hash = self.openai_utils.hash_contenido_1(user_prompt_str)
            cached_response = self.openai_utils.obtener_request_hash(self.model_name, request_hash)
            if cached_response:
                logging.debug("Respuesta obtenida desde caché.")
                try:
                    return ConciliacionResponse.model_validate_json(cached_response.response_text)
                except Exception as e:
                    logging.warning(f"Cache invalida para conciliacion, se recalcula con OpenAI: {e}")

            logging.debug("No se encontro respuesta en caché. Procesando con OpenAI...")
            start_time = time.time()
            response, conciliacion_respuesta = self.obtener_respuesta(user_prompt_str)
            response_text = conciliacion_respuesta.model_dump_json(indent=2)
            token_info = self.openai_utils.get_tokens_openai(response)
            end_time = time.time()
            tiempo_ms = int((end_time - start_time) * 1000)
            logging.info(f"Proceso de conciliacion con OpenAI en {tiempo_ms} ms")

            self.guardar_conciliacion_hash(request_text, request_hash, response_text, token_info, tiempo_ms)
            return conciliacion_respuesta
        except Exception as e:
            logging.error(f"Error al obtener la conciliacion: {e}")
            return ConciliacionResponse(fecha=None, monto=None, emisor=None, receptor=None)

    @staticmethod
    def get_prompt(texto: str) -> str:
        cabecera = """
        A continuación se presentará el texto de un documento relacionado a una transferencia bancaria

        Este es el contexto:
            - Este documento deberia contener informacion de pago
            - Si no se encuentra la informacion requerida, la tabla debe quedar vacia

        Por favor, organiza esta información en una estructura con las siguientes columnas:
            - Fecha: Fecha en que se realizo la transferencia en formato: YYYY-MM-DD.
            - Nombre: Nombre de la persona o entidad que envia la transferecia.
            - Rut: Rol Único Tributario de la persona o entidad que envia la transferencia. Si el Nro de cuenta parece el RUT pero le falta el digito verificador, calcularlo utilizando el Modulo 11.
            - Monto: Monto por el cual se realiza la transferencia.

        La información se presenta a continuación:

        ```text
        """
        contenido: list[str] = []
        for linea in texto.splitlines():
            if linea.strip():
                linea_full = linea.strip().replace("  ", " ")
                contenido.append(linea_full)
        return cabecera + "\n".join(contenido) + "\n```"
    
    def obtener_respuesta(self, user_prompt_str: str) -> tuple[Response, ConciliacionResponse]:
        content_txt = ResponseInputTextContentParam(type="input_text", text=user_prompt_str)
        input_message = EasyInputMessageParam(content=[content_txt], role="user")
        response = self.client.responses.parse(model=self.model_name, input=[input_message], text_format=ConciliacionResponse)
        conciliacion_response: ConciliacionResponse = response.output_parsed
        return response, conciliacion_response
    
    def guardar_conciliacion_hash(self, request_text: str, request_hash: str, response_text: str, token_info: TokenInfo, tiempo_ms: int) -> None:
        self.openai_utils.guardar_request_hash(self.model_name, request_text, request_hash, response_text, token_info, tiempo_ms)