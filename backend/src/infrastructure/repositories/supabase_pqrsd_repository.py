from __future__ import annotations

import httpx

from src.domain.services.errors import PersistenceError


class SupabasePqrsdRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._base_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    async def insert_request(self, record: dict) -> None:
        url = f"{self._base_url}/rest/v1/pqrsd_requests"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, json=record)

        if response.status_code >= 400:
            raise PersistenceError("No fue posible guardar la solicitud en Supabase.")

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

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers=headers, params=params)

        if response.status_code >= 400:
            raise PersistenceError("No fue posible consultar la PQRS mas reciente.")

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

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.patch(
                url, headers=headers, params=params, json=updates
            )

        if response.status_code >= 400:
            raise PersistenceError("No fue posible actualizar la PQRS.")

        rows = response.json()
        if not rows:
            return None
        return rows[0]
