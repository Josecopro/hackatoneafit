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

Puedes crear el archivo local con:

```bash
cp .env.example .env.local
```

## Endpoints

- `GET /health`
- `POST /api/pqrsd/normal`
- `POST /api/pqrsd/anonymous`
