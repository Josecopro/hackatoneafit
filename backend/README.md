# Backend PQRSD

Backend incremental para extraer lógica de negocio del frontend sin romper el flujo actual.

## Arquitectura

Estructura por capas con puertos/adaptadores:

- `src/entrypoints/http`: API FastAPI (adaptador de entrada)
- `src/application/use_cases`: casos de uso
- `src/domain/ports`: contratos (puertos)
- `src/infrastructure/repositories`: adaptadores de salida

## Ejecutar

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Variables de entorno

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (opcional, por defecto `pqrsd-attachments`)
- `CORS_ALLOWED_ORIGINS` (opcional, CSV de orígenes permitidos)
- `GROQ_API_KEY` (requerida para el flujo de agentes con LLM)
- `GROQ_MODEL` (opcional, por defecto `llama-3.1-8b-instant`)
- `GROQ_FALLBACK_MODELS` (opcional, CSV de modelos de respaldo)

Puedes crear el archivo local con:

```bash
cp .env.example .env.local
```

## Endpoints

- `GET /health`
- `POST /api/pqrsd/normal`
- `POST /api/pqrsd/anonymous`

## Migraciones SQL

El repositorio incluye una migracion idempotente para el modelo actual de `pqrsd_requests`:

- `backend/migrations/20260419_pqrsd_requests_admin_models.sql`

Como en este proyecto no hay Supabase CLI configurado, puedes ejecutarla desde el SQL Editor de Supabase.
