from __future__ import annotations

import json

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from src.application.use_cases.create_anonymous_pqrsd import CreateAnonymousPqrsdUseCase
from src.application.use_cases.create_normal_pqrsd import CreateNormalPqrsdUseCase
from src.domain.services.errors import PersistenceError
from src.domain.services.tracking import build_tracking_id
from src.entrypoints.http.schemas import (
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

    return app
