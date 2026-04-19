from __future__ import annotations

from pathlib import Path

LEGAL_CORPUS_DIR = Path(__file__).resolve().parents[3] / "legal_corpus"

ALLOWED_GOV_SOURCES = [
    "https://www.medellin.gov.co/es/secretaria-desarrollo-economico/",
    "https://www.medellin.gov.co/es/secretaria-desarrollo-economico/que-hace-la-secretaria/",
]

LEGAL_FILES = [
    ("Ley 1755 de 2015", "ley_1755_2015.md", "COLLECT_FROM_OFFICIAL_SOURCE"),
    ("Decreto 833 de 2015", "decreto_833_2015.md", "COLLECT_FROM_OFFICIAL_SOURCE"),
    (
        "Constitución Política de Colombia - Artículo 23",
        "constitucion_articulo_23.md",
        "COLLECT_FROM_OFFICIAL_SOURCE",
    ),
    (
        "Competencias Secretaría de Desarrollo Económico",
        "secretaria_desarrollo_economico_competencias.md",
        "https://www.medellin.gov.co/es/secretaria-desarrollo-economico/que-hace-la-secretaria/",
    ),
]


def _read_corpus_file(file_name: str) -> str:
    path = LEGAL_CORPUS_DIR / file_name
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _compact_snippet(content: str) -> str:
    if not content.strip():
        return "Sin contenido cargado."
    lines = [
        line.strip()
        for line in content.splitlines()
        if line.strip() and not line.startswith("#")
    ]
    if not lines:
        return "Sin contenido cargado."
    return " ".join(lines[:4])[:420]


def legal_context_for(department: str) -> list[dict]:
    # Minimal deterministic retrieval to keep the feature fully open and local.
    results = []
    for source_name, file_name, url in LEGAL_FILES:
        content = _read_corpus_file(file_name)
        results.append(
            {
                "source": source_name,
                "snippet": _compact_snippet(content),
                "department": "General" if department else "General",
                "url": url,
            }
        )
    return results[:5]
