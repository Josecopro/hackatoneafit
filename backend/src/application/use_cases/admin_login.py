from __future__ import annotations

import bcrypt

from src.domain.ports.admin_repository import AdminRepository
from src.domain.services.errors import AuthenticationError


class AdminLoginUseCase:
    def __init__(self, repository: AdminRepository) -> None:
        self._repository = repository

    async def execute(self, *, email: str, password: str) -> dict:
        admin = await self._repository.get_admin_by_email(email)

        if not admin or not admin.get("is_active", False):
            raise AuthenticationError("Credenciales invalidas.")

        password_hash = admin.get("password_hash") or ""

        try:
            is_valid = bcrypt.checkpw(
                password.encode("utf-8"),
                password_hash.encode("utf-8"),
            )
        except ValueError as exc:
            raise AuthenticationError("Credenciales invalidas.") from exc

        if not is_valid:
            raise AuthenticationError("Credenciales invalidas.")

        await self._repository.touch_last_login(admin["id"])

        return {
            "id": admin["id"],
            "email": admin["email"],
            "full_name": admin["full_name"],
        }