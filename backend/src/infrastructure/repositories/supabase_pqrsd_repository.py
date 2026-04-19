from __future__ import annotations

import asyncio
import hashlib
import math
import re

import httpx

from src.domain.services.errors import PersistenceError


_TOKEN_PATTERN = re.compile(r"\w+", re.UNICODE)


def _embedding_literal(text: str, dims: int = 768) -> str:
    vector = [0.0] * dims
    normalized_text = (text or "").lower().strip()
    tokens = _TOKEN_PATTERN.findall(normalized_text)

    if not tokens:
        tokens = ["vacio"]

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:2], byteorder="big") % dims
        sign = 1.0 if digest[2] % 2 == 0 else -1.0
        weight = 1.0 + (digest[3] / 255.0) * 0.25
        vector[index] += sign * weight

    norm = math.sqrt(sum(value * value for value in vector))
    if norm > 0.0:
        vector = [value / norm for value in vector]

    return "[" + ",".join(f"{value:.6f}" for value in vector) + "]"


class SupabasePqrsdRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._base_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    async def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        last_error: httpx.HTTPError | None = None

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    return await client.request(method, url, **kwargs)
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt < 2:
                    await asyncio.sleep(0.4 * (attempt + 1))

        raise PersistenceError(
            "No fue posible conectar con Supabase. Verifica DNS/red y vuelve a intentar."
        ) from last_error

    async def insert_request(self, record: dict) -> dict:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        response = await self._request_with_retry(
            "POST",
            url,
            headers=headers,
            json=record,
        )

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible guardar la solicitud en Supabase (HTTP {response.status_code})."
            )

        rows = response.json()
        if not rows:
            raise PersistenceError(
                "Supabase no retorno la solicitud creada para sincronizar el indice vectorial."
            )
        return rows[0]

    async def fetch_latest_request(self) -> dict | None:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Accept": "application/json",
        }
        params = {
            "select": "*",
            "order": "created_at.desc",
            "limit": "1",
        }

        response = await self._request_with_retry(
            "GET",
            url,
            headers=headers,
            params=params,
        )

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible consultar la PQRS mas reciente (HTTP {response.status_code})."
            )

        rows = response.json()
        if not rows:
            return None
        return rows[0]

    async def fetch_requests(self, limit: int = 100) -> list[dict]:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Accept": "application/json",
        }
        params = {
            "select": "*",
            "order": "created_at.desc",
            "limit": str(limit),
        }

        response = await self._request_with_retry(
            "GET",
            url,
            headers=headers,
            params=params,
        )

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible consultar el listado de PQRS (HTTP {response.status_code})."
            )

        rows = response.json()
        if not isinstance(rows, list):
            return []
        return rows

    async def fetch_request_by_id(self, request_id: str) -> dict | None:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Accept": "application/json",
        }
        params = {
            "select": "*",
            "id": f"eq.{request_id}",
            "limit": "1",
        }

        response = await self._request_with_retry(
            "GET",
            url,
            headers=headers,
            params=params,
        )

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible consultar el detalle de la PQRS (HTTP {response.status_code})."
            )

        rows = response.json()
        if not rows:
            return None
        return rows[0]

    async def patch_request(self, request_id: str, updates: dict) -> dict | None:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        params = {
            "id": f"eq.{request_id}",
            "select": "*",
        }

        response = await self._request_with_retry(
            "PATCH",
            url,
            headers=headers,
            params=params,
            json=updates,
        )

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible actualizar la PQRS (HTTP {response.status_code})."
            )

        rows = response.json()
        if not rows:
            return None
        return rows[0]

    async def upsert_vector_pqrs(self, request_record: dict) -> None:
        request_id = str(request_record.get("id") or "").strip()
        if not request_id:
            return

        description = str(request_record.get("description") or "").strip()
        if not description:
            return

        department = str(request_record.get("department") or "General").strip() or "General"

        url = f"{self._base_url}/rest/v1/pqrs"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }
        params = {"on_conflict": "id"}
        payload = {
            "id": request_id,
            "texto_original": description,
            "departamento": department,
            "embedding": _embedding_literal(description),
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, params=params, json=payload)

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible sincronizar la tabla vectorial pqrs (HTTP {response.status_code})."
            )

    async def save_official_response(
        self,
        *,
        request_record: dict,
        official_response: str,
        approved_by: str,
    ) -> None:
        request_id = str(request_record.get("id") or "").strip()
        if not request_id:
            raise PersistenceError("No se pudo identificar la PQRS a responder.")

        await self.upsert_vector_pqrs(request_record)

        payload = request_record.get("payload") if isinstance(request_record.get("payload"), dict) else {}
        flow = payload.get("agent_flow") if isinstance(payload.get("agent_flow"), dict) else {}
        draft = str(flow.get("borrador_respuesta") or "").strip() or None

        respuestas_url = f"{self._base_url}/rest/v1/respuestas"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        response_payload = {
            "pqrs_id": request_id,
            "texto_borrador": draft,
            "texto_final": official_response,
            "aprobada": True,
            "aprobada_por": approved_by,
            "requiere_revision": False,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                respuestas_url,
                headers=headers,
                json=response_payload,
            )

        if response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible guardar la respuesta oficial (HTTP {response.status_code})."
            )

        response_rows = response.json()
        if not response_rows:
            raise PersistenceError("No se pudo recuperar la respuesta oficial creada.")
        respuesta_id = str(response_rows[0].get("id") or "").strip()
        if not respuesta_id:
            raise PersistenceError("La respuesta oficial no tiene id para enlazar respuestas_oro.")

        respuestas_oro_url = f"{self._base_url}/rest/v1/respuestas_oro"
        search_params = {
            "select": "id",
            "origen_respuesta_id": f"eq.{respuesta_id}",
            "limit": "1",
        }
        search_headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            search_response = await client.get(
                respuestas_oro_url,
                headers=search_headers,
                params=search_params,
            )

        if search_response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible verificar respuestas_oro (HTTP {search_response.status_code})."
            )

        existing = search_response.json()
        if existing:
            respuesta_oro_id = str(existing[0].get("id") or "").strip()
        else:
            department = str(request_record.get("department") or "General").strip() or "General"
            subject = str(request_record.get("subject") or "").strip()
            case_type = subject or str(request_record.get("description") or "").strip()[:100]
            create_headers = {
                "apikey": self._service_role_key,
                "Authorization": f"Bearer {self._service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }
            create_payload = {
                "caso_tipo": case_type,
                "respuesta": official_response,
                "departamento": department,
                "origen_respuesta_id": respuesta_id,
            }

            async with httpx.AsyncClient(timeout=20.0) as client:
                create_response = await client.post(
                    respuestas_oro_url,
                    headers=create_headers,
                    json=create_payload,
                )

            if create_response.status_code >= 400:
                raise PersistenceError(
                    f"No fue posible crear la fila en respuestas_oro (HTTP {create_response.status_code})."
                )

            created_rows = create_response.json()
            if not created_rows:
                raise PersistenceError("No se pudo recuperar la fila creada en respuestas_oro.")
            respuesta_oro_id = str(created_rows[0].get("id") or "").strip()

        if not respuesta_oro_id:
            raise PersistenceError("No se pudo determinar el id en respuestas_oro.")

        patch_headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        patch_params = {"id": f"eq.{respuesta_oro_id}"}
        patch_payload = {
            "respuesta": official_response,
            "embedding": _embedding_literal(official_response),
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            patch_response = await client.patch(
                respuestas_oro_url,
                headers=patch_headers,
                params=patch_params,
                json=patch_payload,
            )

        if patch_response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible persistir embedding en respuestas_oro (HTTP {patch_response.status_code})."
            )

    async def search_quick_replies(
        self,
        *,
        text: str,
        department: str | None,
        limit: int = 5,
    ) -> list[dict]:
        normalized_text = (text or "").strip()
        if not normalized_text:
            return []

        dept_id: int | None = None
        normalized_department = (department or "").strip()
        if normalized_department:
            departments_url = f"{self._base_url}/rest/v1/departamentos"
            departments_headers = {
                "apikey": self._service_role_key,
                "Authorization": f"Bearer {self._service_role_key}",
                "Accept": "application/json",
            }
            departments_params = {
                "select": "id",
                "nombre": f"eq.{normalized_department}",
                "limit": "1",
            }

            async with httpx.AsyncClient(timeout=20.0) as client:
                dept_response = await client.get(
                    departments_url,
                    headers=departments_headers,
                    params=departments_params,
                )

            if dept_response.status_code >= 400:
                raise PersistenceError(
                    f"No fue posible consultar departamentos para sugerencias rapidas (HTTP {dept_response.status_code})."
                )

            dept_rows = dept_response.json()
            if dept_rows:
                dept_value = dept_rows[0].get("id")
                if isinstance(dept_value, int):
                    dept_id = dept_value

        rpc_url = f"{self._base_url}/rest/v1/rpc/buscar_respuestas_rapidas"
        rpc_headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }
        rpc_payload = {
            "query_embedding": _embedding_literal(normalized_text),
            "dept_id": dept_id,
            "match_count": max(1, min(limit, 5)),
            "similarity_threshold": 0.60,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            rpc_response = await client.post(
                rpc_url,
                headers=rpc_headers,
                json=rpc_payload,
            )

        if rpc_response.status_code >= 400:
            raise PersistenceError(
                f"No fue posible consultar sugerencias rapidas (HTTP {rpc_response.status_code})."
            )

        rows = rpc_response.json()
        if not isinstance(rows, list):
            return []
        return rows
