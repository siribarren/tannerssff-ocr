from pathlib import Path
from dotenv import load_dotenv

local_path = Path(__file__).parent
env_file = local_path.parent / ".env-desarrollo"
print(f"env_file: {env_file}")
load_dotenv(env_file)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.web_route import router
from src.config.log_config import configurar_log

configurar_log()

title = "Tanner SSFF-OCR"
version = "1.0.0"
descripcion = """
Backend Proyecto TANNER SSFF-OCR
"""

app = FastAPI(title=title, version=version, description=descripcion, docs_url="/swagger", root_path="/api")

#COnfiguracion CORS
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

app.include_router(router)