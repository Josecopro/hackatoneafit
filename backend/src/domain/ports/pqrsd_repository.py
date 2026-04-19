from __future__ import annotations

from typing import Protocol


class PqrsdRepository(Protocol):
    async def insert_request(self, record: dict) -> None: ...

    async def fetch_latest_request(self) -> dict | None: ...

    async def patch_request(self, request_id: str, updates: dict) -> dict | None: ...
