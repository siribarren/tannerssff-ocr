# Comandos

Todos los comandos se ejecutan desde `backend/`.

## Setup en una máquina nueva

```bash
# 1. Instalar dependencias (desde uv.lock)
uv sync

# 2. Crear el archivo de entorno .env-desarrollo con:
#    AMBIENTE=local            # "local" = Postgres en Docker; "sqlite" = SQLite local
#    BD_NAME=tannerssff
#    BD_HOST=localhost
#    BD_PORT=5433              # puerto mapeado en docker-compose.yml
#    BD_USER=tannerssff
#    BD_PASS=<password, igual al POSTGRES_PASSWORD del compose>
#    BASE_DIR=<ruta absoluta a backend>
#    OPENAI_API_KEY=<key>
#    OPENAI_MODEL=<modelo, ej: gpt-5-nano>
#    (+ credenciales de Document AI / service account de GCP)

# 3. Levantar Postgres (solo si AMBIENTE=local)
docker compose up -d

# 4. Crear / actualizar la base de datos
uv run alembic upgrade head

# 5. Levantar la API
uvicorn src.app:app --reload --port 8000
```

Swagger: http://127.0.0.1:8000/api/swagger

## Postgres con Docker (AMBIENTE=local)

```bash
docker compose up -d        # levantar Postgres en segundo plano
docker compose down         # detener (conserva los datos en el volumen pgdata)
docker compose down -v      # detener y BORRAR los datos (resetea credenciales)
docker compose logs -f      # ver logs del contenedor
```

> Las credenciales se definen en `docker-compose.yml` (`POSTGRES_USER/PASSWORD/DB`)
> y deben coincidir con las `BD_USER/BD_PASS/BD_NAME` del `.env-desarrollo`.
> Postgres solo lee esas credenciales la **primera vez** que se crea el volumen
> `pgdata`; para cambiarlas hay que hacer `docker compose down -v` y volver a subir.
> El puerto del host es **5433** (en `docker-compose.yml`) para no chocar con un
> Postgres nativo instalado en la máquina.

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
