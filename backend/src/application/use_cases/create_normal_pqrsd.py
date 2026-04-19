from __future__ import annotations

from src.domain.ports.pqrsd_repository import PqrsdRepository


class CreateNormalPqrsdUseCase:
    def __init__(self, repository: PqrsdRepository) -> None:
        self._repository = repository

    async def execute(
        self, *, tracking_id: str, payload: dict, attachments: list[dict]
    ) -> None:
        record = {
            "tracking_id": tracking_id,
            "request_type": "normal",
            "status": "received",
            "subject": payload["subject"],
            "description": payload["description"],
            "incident_address": payload["incident_address"],
            "email": payload["email"],
            "phone": payload["phone"],
            "person_type": payload["person_type"],
            "doc_type": payload.get("doc_type") or None,
            "doc_number": payload.get("doc_number") or None,
            "full_name": payload["full_name"],
            "department": payload["department"],
            "city": payload["city"],
            "address": payload["address"],
            "attachments_count": payload.get("attachments_count", 0),
            "attachments": attachments,
            "payload": payload,
        }
        await self._repository.insert_request(record)
