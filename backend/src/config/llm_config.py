from functools import lru_cache
from os import environ

class LlmConfig:
    openai_api_key: str
    openai_model: str
    opencode_api_key: str
    opencode_model: str

    def __init__(self, openai_api_key: str, openai_model: str, opencode_api_key: str, opencode_model: str):
        self.openai_api_key = openai_api_key
        self.openai_model = openai_model
        self.opencode_api_key = opencode_api_key
        self.opencode_model = opencode_model
        

@lru_cache(maxsize=1)
def get_llm_config() -> LlmConfig:
    openai_api_key = environ.get("OPENAI_API_KEY")
    assert openai_api_key, "La variable de entorno OPENAI_API_KEY no está configurada"

    openai_model = environ.get("OPENAI_MODEL")
    assert openai_model, "La variable de entorno OPENAI_MODEL no está configurada"

    opencode_api_key = environ.get("OPENCODE_API_KEY")
    assert opencode_api_key, "La variable de entorno OPENCODE_API_KEY no está configurada"

    opencode_model = environ.get("OPENCODE_MODEL")
    assert opencode_model, "La variable de entorno OPENCODE_MODEL no está configurada"

    config = LlmConfig(
        openai_api_key=openai_api_key,
        openai_model=openai_model,
        opencode_api_key=openai_api_key,
        opencode_model=opencode_model
    )

    return config