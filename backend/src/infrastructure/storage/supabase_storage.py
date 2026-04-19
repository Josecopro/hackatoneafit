from __future__ import annotations

import re
import unicodedata
from typing import Any

import httpx


MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_FILES = 5


class SupabaseStorageError(Exception):
    """Raised when attachment upload or cleanup fails."""


class SupabaseStorageClient:
    def __init__(self, *, supabase_url: str, service_role_key: str, bucket_name: str) -> None:
        self._base_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key
        self._bucket_name = bucket_name

    async def upload_attachments(
        self,
        *,
        request_type: str,
        tracking_id: str,
        files: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if len(files) > MAX_FILES:
            raise SupabaseStorageError(f"Solo se permiten hasta {MAX_FILES} archivos adjuntos.")

        uploaded: list[dict[str, Any]] = []
        for index, file in enumerate(files):
            file_name = str(file["filename"])
            content = file["content"]
            content_type = str(file.get("content_type") or "application/octet-stream")
            size = len(content)

            if size > MAX_FILE_SIZE_BYTES:
                raise SupabaseStorageError(f"El archivo {file_name} supera el limite de 10 MB.")

            extension = _get_file_extension(file_name)
            base_name = _sanitize_file_name(file_name.rsplit(".", 1)[0] if "." in file_name else file_name)
            normalized_file_name = f"{index + 1:02d}-{base_name}{extension}"
            path = f"{request_type}/{tracking_id}/{normalized_file_name}"

            upload_url = f"{self._base_url}/storage/v1/object/{self._bucket_name}/{path}"
            headers = {
                "apikey": self._service_role_key,
                "Authorization": f"Bearer {self._service_role_key}",
                "x-upsert": "false",
                "Content-Type": content_type,
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(upload_url, headers=headers, content=content)

            if response.status_code >= 400:
                await self.remove_attachments(uploaded)
                raise SupabaseStorageError(f"No fue posible subir el archivo {file_name}.")

            uploaded.append(
                {
                    "bucket": self._bucket_name,
                    "path": path,
                    "name": file_name,
                    "size": size,
                    "mimeType": content_type,
                }
            )

        return uploaded

    async def remove_attachments(self, attachments: list[dict[str, Any]]) -> None:
        if not attachments:
            return

        paths = [item["path"] for item in attachments]
        remove_url = f"{self._base_url}/storage/v1/object/{self._bucket_name}"
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            await client.delete(remove_url, headers=headers, json={"prefixes": paths})


def _sanitize_file_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    collapsed = re.sub(r"[^a-zA-Z0-9_-]", "-", ascii_value)
    collapsed = re.sub(r"-+", "-", collapsed).strip("-")
    return collapsed or "archivo"


def _get_file_extension(file_name: str) -> str:
    if "." not in file_name:
        return ""
    extension = file_name[file_name.rfind(".") :].lower()
    return extension if len(extension) <= 10 else ""
