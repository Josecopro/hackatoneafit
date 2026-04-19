from __future__ import annotations

import json

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from src.application.agent_flow import run_minimal_agent_flow
from src.application.agent_flow.knowledge_base import ALLOWED_GOV_SOURCES
from src.application.use_cases.create_anonymous_pqrsd import CreateAnonymousPqrsdUseCase
from src.application.use_cases.create_normal_pqrsd import CreateNormalPqrsdUseCase
from src.domain.services.errors import PersistenceError
from src.domain.services.tracking import build_tracking_id
from src.entrypoints.http.schemas import (
    AgentFlowRunResponse,
    AgentFlowSummary,
    AnonymousPayloadIn,
    CreateResponse,
    NormalPayloadIn,
)
from src.infrastructure.config.settings import Settings
from src.infrastructure.repositories.supabase_pqrsd_repository import (
    SupabasePqrsdRepository,
)
from src.infrastructure.storage.supabase_storage import (
    SupabaseStorageClient,
    SupabaseStorageError,
)


def build_app() -> FastAPI:
    settings = Settings()
    settings.validate()

    repository = SupabasePqrsdRepository(
        supabase_url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
    )
    storage = SupabaseStorageClient(
        supabase_url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
        bucket_name=settings.supabase_storage_bucket,
    )
    create_normal = CreateNormalPqrsdUseCase(repository)
    create_anonymous = CreateAnonymousPqrsdUseCase(repository)

    app = FastAPI(title="PQRSD Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict:
        return {"ok": True}

    @app.post("/api/pqrsd/normal", response_model=CreateResponse)
    async def create_normal_request(
        payload: str = Form(...),
        attachments: list[UploadFile] = File(default=[]),
    ) -> CreateResponse:
        uploaded_attachments: list[dict] = []
        try:
            parsed_payload = NormalPayloadIn.model_validate(json.loads(payload))
            parsed_payload.attachments_count = len(attachments)
            tracking_id = build_tracking_id("PQR")

            files = []
            for file in attachments:
                files.append(
                    {
                        "filename": file.filename or "archivo",
                        "content_type": file.content_type or "application/octet-stream",
                        "content": await file.read(),
                    }
                )

            uploaded_attachments = await storage.upload_attachments(
                request_type="normal",
                tracking_id=tracking_id,
                files=files,
            )

            await create_normal.execute(
                tracking_id=tracking_id,
                payload=parsed_payload.model_dump(),
                attachments=uploaded_attachments,
            )
        except (ValueError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except SupabaseStorageError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except PersistenceError as exc:
            await storage.remove_attachments(uploaded_attachments)
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        return CreateResponse(
            success=True,
            message="PQRSD radicada exitosamente con identidad verificada.",
            trackingId=tracking_id,
        )

    @app.post("/api/pqrsd/anonymous", response_model=CreateResponse)
    async def create_anonymous_request(
        payload: str = Form(...),
        attachments: list[UploadFile] = File(default=[]),
    ) -> CreateResponse:
        uploaded_attachments: list[dict] = []
        try:
            parsed_payload = AnonymousPayloadIn.model_validate(json.loads(payload))
            parsed_payload.attachments_count = len(attachments)
            tracking_id = build_tracking_id("ANON")

            files = []
            for file in attachments:
                files.append(
                    {
                        "filename": file.filename or "archivo",
                        "content_type": file.content_type or "application/octet-stream",
                        "content": await file.read(),
                    }
                )

            uploaded_attachments = await storage.upload_attachments(
                request_type="anonymous",
                tracking_id=tracking_id,
                files=files,
            )

            await create_anonymous.execute(
                tracking_id=tracking_id,
                payload=parsed_payload.model_dump(),
                attachments=uploaded_attachments,
            )
        except (ValueError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except SupabaseStorageError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except PersistenceError as exc:
            await storage.remove_attachments(uploaded_attachments)
            raise HTTPException(status_code=500, detail=str(exc)) from exc

        return CreateResponse(
            success=True,
            message="PQRSD radicada exitosamente de forma anonima.",
            trackingId=tracking_id,
        )

    @app.post("/api/admin/agent-flow/run-latest", response_model=AgentFlowRunResponse)
    async def run_latest_agent_flow() -> AgentFlowRunResponse:
        latest = await repository.fetch_latest_request()
        if not latest:
            raise HTTPException(
                status_code=404, detail="No hay PQRS registradas para procesar."
            )

        try:
            state = run_minimal_agent_flow(latest)
        except RuntimeError as exc:
            detail = str(exc)
            lowered = detail.lower()
            if "rate-limited" in lowered:
                status_code = 503
            elif (
                "could not find configured models" in lowered
                or "model not found" in lowered
            ):
                status_code = 400
            else:
                status_code = 400
            raise HTTPException(status_code=status_code, detail=detail) from exc

        original_payload = (
            latest.get("payload") if isinstance(latest.get("payload"), dict) else {}
        )
        updated_payload = {
            **original_payload,
            "agent_flow": {
                "departamento": state.departamento,
                "estado": state.estado,
                "es_competencia_secretaria": state.es_competencia_secretaria,
                "motivo_no_competencia": state.motivo_no_competencia,
                "detalle_competencia": state.detalle_competencia,
                "fragmento_competente": state.fragmento_competente,
                "fuera_competencia": state.fuera_competencia,
                "sentimiento_label": state.sentimiento_label,
                "sentimiento_score": state.sentimiento_score,
                "tipo_peticion": state.tipo_peticion,
                "dias_limite_ley_1755": state.dias_limite_ley_1755,
                "fecha_limite_respuesta": state.fecha_limite_respuesta,
                "normativas_halladas": state.normativas_halladas,
                "respuestas_oro_halladas": state.respuestas_oro_halladas,
                "sin_contexto_legal": state.sin_contexto_legal,
                "borrador_respuesta": state.borrador_respuesta,
                "requiere_humano": state.requiere_humano,
                "razon_revision": state.razon_revision,
                "placeholders_usados": state.placeholders_usados,
                "ciclos_correccion": state.ciclos_correccion,
                "fuentes_gov_permitidas": ALLOWED_GOV_SOURCES,
            },
        }

        await repository.patch_request(
            request_id=state.request_id,
            updates={
                "status": state.estado,
                "payload": updated_payload,
            },
        )

        summary = AgentFlowSummary(
            request_id=state.request_id,
            tracking_id=state.tracking_id,
            departamento=state.departamento,
            estado=state.estado,
            es_competencia_secretaria=state.es_competencia_secretaria,
            motivo_no_competencia=state.motivo_no_competencia,
            detalle_competencia=state.detalle_competencia,
            sentimiento_label=state.sentimiento_label,
            sentimiento_score=state.sentimiento_score,
            tipo_peticion=state.tipo_peticion,
            dias_limite_ley_1755=state.dias_limite_ley_1755,
            fecha_limite_respuesta=state.fecha_limite_respuesta,
            requiere_humano=state.requiere_humano,
            razon_revision=state.razon_revision,
            borrador_respuesta=state.borrador_respuesta,
            fragmento_competente=state.fragmento_competente,
            fuera_competencia=state.fuera_competencia,
            normativas_halladas=state.normativas_halladas,
            fuentes_gov_permitidas=ALLOWED_GOV_SOURCES,
        )

        return AgentFlowRunResponse(
            success=True,
            message="Flujo de agentes ejecutado sobre la PQRS mas reciente.",
            data=summary,
        )

    @app.get("/api/admin/agent-flow/latest", response_model=AgentFlowSummary)
    async def get_latest_agent_flow() -> AgentFlowSummary:
        latest = await repository.fetch_latest_request()
        if not latest:
            raise HTTPException(status_code=404, detail="No hay PQRS registradas.")

        payload = (
            latest.get("payload") if isinstance(latest.get("payload"), dict) else {}
        )
        flow = (
            payload.get("agent_flow")
            if isinstance(payload.get("agent_flow"), dict)
            else {}
        )

        return AgentFlowSummary(
            request_id=str(latest.get("id") or ""),
            tracking_id=str(latest.get("tracking_id") or ""),
            departamento=str(flow.get("departamento") or "General"),
            estado=str(flow.get("estado") or latest.get("status") or "received"),
            es_competencia_secretaria=bool(
                flow.get("es_competencia_secretaria") or False
            ),
            motivo_no_competencia=str(flow.get("motivo_no_competencia") or ""),
            detalle_competencia=str(flow.get("detalle_competencia") or ""),
            sentimiento_label=str(flow.get("sentimiento_label") or "neutro"),
            sentimiento_score=float(flow.get("sentimiento_score") or 0.0),
            tipo_peticion=str(flow.get("tipo_peticion") or "peticion_general"),
            dias_limite_ley_1755=int(flow.get("dias_limite_ley_1755") or 15),
            fecha_limite_respuesta=str(flow.get("fecha_limite_respuesta") or ""),
            requiere_humano=bool(flow.get("requiere_humano") or False),
            razon_revision=str(flow.get("razon_revision") or ""),
            borrador_respuesta=str(flow.get("borrador_respuesta") or ""),
            fragmento_competente=str(flow.get("fragmento_competente") or ""),
            fuera_competencia=list(flow.get("fuera_competencia") or []),
            normativas_halladas=list(flow.get("normativas_halladas") or []),
            fuentes_gov_permitidas=list(
                flow.get("fuentes_gov_permitidas") or ALLOWED_GOV_SOURCES
            ),
        )

    return app
