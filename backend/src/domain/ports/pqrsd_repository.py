from __future__ import annotations

from typing import Protocol


class PqrsdRepository(Protocol):
    async def insert_request(self, record: dict) -> None:
        ...
