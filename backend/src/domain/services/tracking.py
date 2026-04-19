from __future__ import annotations

import secrets
import time


def build_tracking_id(prefix: str) -> str:
    random_suffix = secrets.randbelow(900000) + 100000
    return f"{prefix}-{int(time.time() * 1000)}-{random_suffix}"
