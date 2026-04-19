from __future__ import annotations

from datetime import UTC, datetime

import httpx

from src.domain.services.errors import PersistenceError


class SupabaseAdminRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._base_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def _headers(self) -> dict:
        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    async def get_admin_by_email(self, email: str) -> dict | None:
        url = f"{self._base_url}/rest/v1/admin_users"
        normalized_email = email.strip().lower()

        params = {
            "select": "id,email,full_name,password_hash,is_active",
            "email": f"eq.{normalized_email}",
            "limit": "1",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers=self._headers(), params=params)

        if response.status_code >= 400:
            raise PersistenceError("No fue posible consultar administradores en Supabase.")

        rows = response.json()
        if not isinstance(rows, list) or not rows:
            return None

        return rows[0]

    async def touch_last_login(self, admin_id: str) -> None:
        url = f"{self._base_url}/rest/v1/admin_users"
        params = {"id": f"eq.{admin_id}"}
        payload = {"last_login_at": datetime.now(UTC).isoformat()}

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.patch(
                url,
                headers=self._headers(),
                params=params,
                json=payload,
            )

        if response.status_code >= 400:
            raise PersistenceError("No fue posible actualizar el ultimo acceso del administrador.")