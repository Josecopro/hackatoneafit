from __future__ import annotations

import os


class Settings:
    def __init__(self) -> None:
        self.supabase_url = (os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
        self.supabase_storage_bucket = (
            os.getenv("SUPABASE_STORAGE_BUCKET") or "pqrsd-attachments"
        )

    def validate(self) -> None:
        if not self.supabase_url:
            raise RuntimeError("Missing SUPABASE_URL")
        if not self.supabase_service_role_key:
            raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")
