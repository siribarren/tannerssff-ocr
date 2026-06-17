# Comandos

Todos los comandos se ejecutan desde `backend/`.

## Setup en una máquina nueva

```bash
# 1. Instalar dependencias (desde uv.lock)
uv sync

# 2. Crear el archivo de entorno .env-desarrollo con:
#    AMBIENTE=sqlite
#    BD_NAME=tannerssff
#    BASE_DIR=<ruta absoluta a backend>
#    OPENAI_API_KEY=<key>
#    OPENAI_MODEL=<modelo, ej: gpt-5-nano>
#    (+ credenciales de Document AI / service account de GCP)

# 3. Crear / actualizar la base de datos
uv run alembic upgrade head

# 4. Levantar la API
uvicorn src.app:app --reload --port 8000
```

Swagger: http://127.0.0.1:8000/api/swagger

## Base de datos (Alembic)

```bash
# Aplicar migraciones pendientes (crea la DB si no existe)
uv run alembic upgrade head

# Generar una migración tras cambiar src/bd/schema.py
uv run alembic revision --autogenerate -m "descripcion del cambio"

# Ver estado / historial
uv run alembic current
uv run alembic history

# Revertir la última migración
uv run alembic downgrade -1
```

> La `.db` de SQLite y el `.env-desarrollo` no se versionan. En cualquier
> máquina nueva la DB se regenera con `alembic upgrade head`.

## Dependencias

```bash
uv add <paquete>      # agregar
uv remove <paquete>   # quitar
uv sync               # sincronizar con uv.lock
```
