# Backend PQRSD (FastAPI)

Backend desacoplado para radicacion y gestion de PQRSD, construido con FastAPI, Supabase REST, Supabase Storage y flujo asistido por agentes para triage y borradores.

## Flujo funcional

- Entrada: salud del servicio con ping de monitoreo.
- Radicacion normal: formulario completo con identidad, validaciones y adjuntos.
- Radicacion anonima: formulario reducido protegiendo identidad.
- Sugerencias rapidas: recuperacion semantica de respuestas validadas.
- Administracion: login, bandeja, detalle, borrador y cierre con respuesta oficial.
- Agentes: triage de competencia, contexto legal y draft institucional en segundo plano operativo.

## Estructura principal

- src/entrypoints/http/app.py: armado de app FastAPI, CORS y endpoints.
- src/entrypoints/http/schemas.py: contratos Pydantic de entrada y salida.
- src/application/use_cases/create_normal_pqrsd.py: caso de uso de radicacion normal.
- src/application/use_cases/create_anonymous_pqrsd.py: caso de uso de radicacion anonima.
- src/application/use_cases/admin_login.py: autenticacion de administrador con bcrypt.
- src/application/agent_flow/pipeline.py: pipeline de triage, enriquecimiento y draft.
- src/application/agent_flow/llm_chain.py: invocacion LLM con fallback de modelos.
- src/application/agent_flow/tools.py: utilidades deterministicas (competencia, sentimiento, limpieza PII).
- src/application/agent_flow/knowledge_base.py: corpus legal local y fuentes permitidas.
- src/domain/ports/pqrsd_repository.py: contrato del repositorio de solicitudes.
- src/domain/ports/admin_repository.py: contrato de repositorio administrativo.
- src/infrastructure/repositories/supabase_pqrsd_repository.py: persistencia principal en Supabase.
- src/infrastructure/repositories/supabase_admin_repository.py: persistencia de admins.
- src/infrastructure/storage/supabase_storage.py: carga/eliminacion de adjuntos.
- src/infrastructure/config/settings.py: variables de entorno y validaciones.
- main.py: entrypoint de ASGI (app = build_app()).

## Endpoints

### Salud

- GET /health

Respuesta:

```json
{ "ok": true }
```

### Radicacion ciudadana

- POST /api/pqrsd/normal
- POST /api/pqrsd/anonymous

Notas:

- Reciben multipart/form-data.
- El campo payload contiene JSON serializado.
- El campo attachments admite hasta 5 archivos.
- Devuelven trackingId.

### Sugerencias semanticas

- POST /api/pqrsd/quick-suggestions

Notas:

- Usa RPC buscar_respuestas_rapidas.
- Top k entre 1 y 5.
- Filtro opcional por departamento.

### Administracion

- POST /api/admin/auth/login
- GET /api/admin/pqrs
- GET /api/admin/pqrs/{request_id}
- POST /api/admin/pqrs/{request_id}/send-response
- POST /api/admin/agent-flow/run-latest
- GET /api/admin/agent-flow/latest

Notas:

- El detalle puede generar borrador automaticamente si no existe.
- El cierre marca estado closed y continua persistencia vectorial en background.

## Reglas de negocio y validaciones

- Confirmacion de correo en radicacion normal (email == confirm_email).
- Maximo 5 adjuntos por solicitud.
- Maximo 10 MB por archivo.
- Tracking ID con prefijo + timestamp + sufijo aleatorio.
- Estados operativos principales: received, in_review, closed.
- Control de errores de dominio por AuthenticationError y PersistenceError.

## Flujo de agentes (resumen operativo)

Pipeline implementado en src/application/agent_flow/pipeline.py:

1. Triage de competencia:

- Evaluacion hibrida (deterministica + LLM).
- Segmentacion en fragmento competente y fuera de competencia.

2. Clasificacion y contexto:

- Sentimiento, tipo de peticion y dias de ley aplicables.
- Carga de contexto legal local desde backend/legal_corpus.

3. Borrador de respuesta:

- Draft institucional via LLM con salida estructurada.
- Fallback deterministico si falla el proveedor.
- Marcado final requiere_humano=true para revision obligatoria.

4. Privacidad:

- Redaccion de PII en texto y borrador (correo, telefono, documentos, direccion e IDs largos).

## Persistencia y almacenamiento

### Supabase REST (repositorio principal)

SupabasePqrsdRepository implementa:

- insert_request
- fetch_latest_request
- fetch_requests
- fetch_request_by_id
- patch_request
- upsert_vector_pqrs
- save_official_response
- search_quick_replies

Comportamiento relevante:

- Reintentos de red con backoff.
- Propagacion de fallos con PersistenceError.
- Embedding local deterministico de 768 dimensiones para sincronizacion vectorial.

### Supabase REST (administradores)

SupabaseAdminRepository implementa:

- get_admin_by_email
- touch_last_login

### Supabase Storage

SupabaseStorageClient implementa:

- upload_attachments
- remove_attachments

Comportamiento relevante:

- Normalizacion de nombres de archivo.
- Limpieza de adjuntos ya subidos si falla una carga intermedia.

## Variables de entorno

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET (opcional, default pqrsd-attachments)
- CORS_ALLOWED_ORIGINS (opcional, CSV)
- GROQ_API_KEY (requerida para flujo LLM)
- GROQ_MODEL (opcional, default llama-3.1-8b-instant)
- GROQ_FALLBACK_MODELS (opcional, CSV)

Validaciones:

- El backend falla si faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.
- El backend falla si SUPABASE_SERVICE_ROLE_KEY corresponde a anon/publishable key.

## Comandos

Requisito: Python 3.11.9.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
uvicorn main:app --reload --port 8000
```

Smoke check rapido:

```bash
curl -fsS http://localhost:8000/health
```

## Migraciones SQL

### Modelo transaccional PQRSD + admin

- backend/migrations/20260419_pqrsd_requests_admin_models.sql
- backend/supabase/admin_auth_schema.sql

Incluye:

- Tabla pqrsd_requests con trigger de updated_at.
- Tabla admin_users con unique email, check en minusculas y trigger de updated_at.

### Modelo vectorial y funciones de busqueda

- backend/migrations/20260419_pqrs_pgvector_full.sql

Incluye:

- Extensiones vector, uuid-ossp y pg_trgm.
- Tablas departamentos, normativas, pqrs, respuestas y respuestas_oro.
- Columnas embedding vector(768).
- Indices HNSW para similitud coseno.
- RPCs: buscar_normativas, buscar_respuestas_oro, buscar_pqrs_similares, buscar_respuestas_rapidas.
- Funcion actualizar_embedding_respuesta_oro.
- Trigger para promocion automatica a respuestas_oro al aprobar respuestas.

### Pruebas de humo SQL

- backend/migrations/20260419_pqrs_pgvector_smoke_tests.sql

Verifica:

- Disponibilidad de funciones.
- Flujo trigger respuestas -> respuestas_oro.
- Búsquedas semanticas por RPC.
- Persistencia de embedding tras actualizacion.

## Corpus legal local

Archivos requeridos en backend/legal_corpus:

- ley_1755_2015.md
- decreto_833_2015.md
- constitucion_articulo_23.md
- secretaria_desarrollo_economico_competencias.md

Notas:

- Se usa como fuente de contexto para el flujo minimal.
- Las fuentes web permitidas se restringen a URLs oficiales de la Secretaria.

## Monitoreo y operacion

Cron de ping cada 5 minutos:

```cron
*/5 * * * * curl -fsS https://TU_BACKEND/health > /dev/null
```

## Auth de administradores (pasos)

1. Ejecuta backend/supabase/admin_auth_schema.sql en Supabase.
2. Instala dependencias del backend.
3. Genera hash bcrypt para la clave.
4. Inserta el usuario en admin_users con email en minuscula.

Ejemplo hash:

```python
import bcrypt
print(bcrypt.hashpw(b"tu-password-seguro", bcrypt.gensalt()).decode())
```

Ejemplo insercion:

```sql
insert into public.admin_users (email, full_name, password_hash)
values ('admin@medellin.gov.co', 'Administrador PQRSD', '$2b$12$...');
```
