from __future__ import annotations

from typing import Protocol


class AdminRepository(Protocol):
    async def get_admin_by_email(self, email: str) -> dict | None: ...

    async def touch_last_login(self, admin_id: str) -> None: ...