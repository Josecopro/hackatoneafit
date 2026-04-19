from __future__ import annotations

import asyncio

import httpx

from src.domain.services.errors import PersistenceError


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

    async def insert_request(self, record: dict) -> None:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
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
