from __future__ import annotations

import os


class Settings:
    def __init__(self) -> None:
        self.supabase_url = (os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
        self.supabase_storage_bucket = (
            os.getenv("SUPABASE_STORAGE_BUCKET") or "pqrsd-attachments"
        )
        self.cors_allowed_origins = self._parse_origins(
            os.getenv("CORS_ALLOWED_ORIGINS")
        )
        self.groq_api_key = os.getenv("GROQ_API_KEY") or ""
        self.groq_model = os.getenv("GROQ_MODEL") or "llama-3.1-8b-instant"
        self.groq_fallback_models = self._parse_csv(os.getenv("GROQ_FALLBACK_MODELS"))

    def validate(self) -> None:
        if not self.supabase_url:
            raise RuntimeError("Missing SUPABASE_URL")
        if not self.supabase_service_role_key:
            raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")
        if self.supabase_service_role_key.startswith("sb_publishable_"):
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Use the service_role key from Supabase settings."
            )
        if self.supabase_service_role_key.startswith("sb_anon_"):
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY is using an anon key. Use the service_role key from Supabase settings."
            )

    @staticmethod
    def _parse_origins(raw_value: str | None) -> list[str]:
        if not raw_value:
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]

        origins = [value.strip() for value in raw_value.split(",") if value.strip()]
        return origins or [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    @staticmethod
    def _parse_csv(raw_value: str | None) -> list[str]:
        if not raw_value:
            return []
        return [value.strip() for value in raw_value.split(",") if value.strip()]
