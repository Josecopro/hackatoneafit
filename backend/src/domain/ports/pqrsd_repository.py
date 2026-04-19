from __future__ import annotations

from typing import Protocol


class PqrsdRepository(Protocol):
    async def insert_request(self, record: dict) -> dict: ...

    async def fetch_latest_request(self) -> dict | None: ...

    async def fetch_requests(self, limit: int = 100) -> list[dict]: ...

    async def fetch_request_by_id(self, request_id: str) -> dict | None: ...

    async def patch_request(self, request_id: str, updates: dict) -> dict | None: ...

    async def upsert_vector_pqrs(self, request_record: dict) -> None: ...

    async def save_official_response(
        self,
        *,
        request_record: dict,
        official_response: str,
        approved_by: str,
    ) -> None: ...

    async def search_quick_replies(
        self,
        *,
        text: str,
        department: str | None,
        limit: int = 5,
    ) -> list[dict]: ...
