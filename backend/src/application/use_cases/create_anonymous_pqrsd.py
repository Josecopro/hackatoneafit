from __future__ import annotations

from src.domain.ports.pqrsd_repository import PqrsdRepository


class CreateAnonymousPqrsdUseCase:
    def __init__(self, repository: PqrsdRepository) -> None:
        self._repository = repository

    async def execute(
        self, *, tracking_id: str, payload: dict, attachments: list[dict]
    ) -> dict:
        record = {
            "tracking_id": tracking_id,
            "request_type": "anonymous",
            "status": "received",
            "subject": payload["subject"],
            "description": payload["description"],
            "incident_address": payload["incident_address"],
            "email": payload.get("email") or None,
            "phone": payload.get("phone") or None,
            "attachments_count": payload.get("attachments_count", 0),
            "attachments": attachments,
            "payload": payload,
        }
        return await self._repository.insert_request(record)
