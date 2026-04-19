from __future__ import annotations

import re
from collections import Counter
from datetime import date, timedelta


IN_SCOPE_KEYWORDS = {
    "secretaria de desarrollo economico",
    "desarrollo economico",
    "subsecretaria de desarrollo rural",
    "umata",
    "banco distrital",
    "emprend",
    "empresa",
    "negocio",
    "empleo",
    "productiv",
    "formaliz",
    "comercio",
    "mipyme",
    "innovaci",
    "competit",
    "internacionaliz",
    "microcredito",
    "mercados campesinos",
    "agroecolog",
    "agrotecnolog",
    "asistencia tecnica",
    "fortalecimiento empresarial",
    "proyectos productivos",
}

OUT_SCOPE_TOPICS = {
    "infraestructura y vias": [
        "hueco",
        "huecos",
        "via",
        "vias",
        "infraestructura",
        "pavimento",
        "alcantarill",
    ],
    "seguridad": ["seguridad", "robo", "roban", "hurto", "policia", "convivencia"],
    "movilidad": ["transito", "movilidad", "comparendo", "semaforo"],
    "salud": ["salud", "hospital", "eps", "medic", "cita medica"],
    "educacion": ["colegio", "educacion", "universidad", "docente"],
    "servicios publicos": [
        "energia",
        "acueducto",
        "aseo",
        "basura",
        "servicios publicos",
    ],
}

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"\b(?:\+?57\s*)?(?:3\d{2}|\d{3})[\s\-]?\d{3}[\s\-]?\d{4}\b")
LONG_ID_RE = re.compile(r"\b\d{7,12}\b")
DOC_RE = re.compile(
    r"\b(?:cc|cedula|c[ée]dula|nit|documento|doc)\s*[:#-]?\s*\d{5,}\b",
    re.IGNORECASE,
)
ADDRESS_RE = re.compile(
    r"\b(?:calle|carrera|cl\.?|cr\.?|av\.?|avenida|diagonal|transversal)\s+[^,.\n]{3,40}",
    re.IGNORECASE,
)


def split_sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+", text.strip())
    return [chunk.strip() for chunk in chunks if chunk.strip()]


def _hits(normalized_text: str, keywords: set[str]) -> list[str]:
    return [keyword for keyword in keywords if keyword in normalized_text]


def summarize_out_of_scope_topics(text: str) -> list[str]:
    normalized = text.lower()
    matches: list[str] = []
    for topic, keywords in OUT_SCOPE_TOPICS.items():
        if any(keyword in normalized for keyword in keywords):
            matches.append(topic)
    return matches


def build_competence_reason(
    own_count: int,
    outside_count: int,
    own_hits: set[str],
    out_topics: list[str],
) -> str:
    if own_count == 0:
        topics = ", ".join(out_topics) if out_topics else "sin tema identificado"
        return (
            "Out of scope: no clear signals for Secretaria de Desarrollo Economico. "
            f"Detected external topics: {topics}."
        )

    own_signals = ", ".join(sorted(own_hits)[:8]) if own_hits else "n/a"
    outside_topics = ", ".join(out_topics) if out_topics else "none"
    return (
        "In scope (partial if mixed): detected at least one Desarrollo Economico signal. "
        f"In-scope sentences: {own_count}. Out-of-scope sentences: {outside_count}. "
        f"Key in-scope signals: {own_signals}. External topics: {outside_topics}."
    )


def extract_secretaria_competence(text: str) -> tuple[str, list[str], bool, str]:

    sentences = split_sentences(text)
    if not sentences:
        return "", [], False, "Out of scope: empty request text."

    own, other = [], []
    own_hits: set[str] = set()
    for sentence in sentences:
        normalized = sentence.lower()
        in_hits = _hits(normalized, IN_SCOPE_KEYWORDS)
        out_topics = summarize_out_of_scope_topics(normalized)
        in_score = len(in_hits)
        out_score = len(out_topics)

        if in_score > 0 and in_score >= out_score:
            own.append(sentence)
            own_hits.update(in_hits)
        else:
            other.append(sentence)

    reason = build_competence_reason(
        own_count=len(own),
        outside_count=len(other),
        own_hits=own_hits,
        out_topics=summarize_out_of_scope_topics(text),
    )

    if own:
        return " ".join(own), other, True, reason

    return "", sentences, False, reason


def evaluate_belonging_signals(text: str) -> dict:
    normalized = text.lower()
    in_scope_hits = _hits(normalized, IN_SCOPE_KEYWORDS)
    out_scope_topics = summarize_out_of_scope_topics(text)

    in_scope_count = len(in_scope_hits)
    out_scope_count = len(out_scope_topics)

    strong_belongs = in_scope_count >= 2 and in_scope_count >= out_scope_count
    strong_not_belongs = in_scope_count == 0 and out_scope_count >= 1
    belongs = in_scope_count > 0 and in_scope_count >= out_scope_count

    summary = (
        "Deterministic signals for SDE ownership -> "
        f"in_scope_hits={sorted(set(in_scope_hits))[:10]}, "
        f"out_scope_topics={out_scope_topics}, "
        f"belongs={belongs}, strong_belongs={strong_belongs}, strong_not_belongs={strong_not_belongs}."
    )

    return {
        "belongs": belongs,
        "strong_belongs": strong_belongs,
        "strong_not_belongs": strong_not_belongs,
        "in_scope_hits": sorted(set(in_scope_hits)),
        "out_scope_topics": out_scope_topics,
        "summary": summary,
    }


def sanitize_personal_data(text: str) -> str:
    sanitized = EMAIL_RE.sub("[REDACTED_EMAIL]", text)
    sanitized = PHONE_RE.sub("[REDACTED_PHONE]", sanitized)
    sanitized = DOC_RE.sub("[REDACTED_DOCUMENT]", sanitized)
    sanitized = ADDRESS_RE.sub("[REDACTED_ADDRESS]", sanitized)
    sanitized = LONG_ID_RE.sub("[REDACTED_ID]", sanitized)
    return sanitized


def sanitize_personal_data_list(items: list[str]) -> list[str]:
    return [sanitize_personal_data(item) for item in items]


def classify_department(text: str) -> str:
    text_lower = text.lower()
    mapping = {
        "Salud": ["salud", "hospital", "eps", "medic"],
        "Educacion": ["colegio", "educacion", "universidad", "docente"],
        "Hacienda": ["impuesto", "hacienda", "tribut", "predial"],
        "Infraestructura": ["vial", "obra", "infraestructura", "alcantarill"],
        "Transito": ["transito", "movilidad", "comparendo", "semaforo"],
    }

    scores = Counter()
    for department, keywords in mapping.items():
        for keyword in keywords:
            if keyword in text_lower:
                scores[department] += 1

    if not scores:
        return "General"
    return scores.most_common(1)[0][0]


def classify_sentiment(text: str) -> tuple[str, float]:
    negative = {
        "malo",
        "demora",
        "incumplimiento",
        "injusto",
        "molesto",
        "queja",
        "reclamo",
        "frustr",
        "estrés",
        "estres",
        "grave",
    }
    positive = {
        "gracias",
        "excelente",
        "satisfecho",
        "oportuno",
        "mejoro",
        "feliz",
    }

    words = re.findall(r"[a-zA-ZáéíóúÁÉÍÓÚñÑ]+", text.lower())
    if not words:
        return "neutro", 0.0

    neg_score = sum(1 for word in words if any(token in word for token in negative))
    pos_score = sum(1 for word in words if any(token in word for token in positive))
    raw = (pos_score - neg_score) / max(len(words), 1)

    if raw < -0.01:
        return "negativo", max(-1.0, raw * 10)
    if raw > 0.01:
        return "positivo", min(1.0, raw * 10)
    return "neutro", raw


def classify_request_type(text: str) -> tuple[str, int]:
    text_lower = text.lower()
    if any(
        keyword in text_lower
        for keyword in ["copia", "documento", "información", "informacion"]
    ):
        return "informacion_documentos", 10
    if "consulta" in text_lower:
        return "consulta", 30
    return "peticion_general", 15


def add_business_days(start_date: date, business_days: int) -> date:
    current = start_date
    remaining = business_days

    while remaining > 0:
        current += timedelta(days=1)
        if current.weekday() < 5:
            remaining -= 1

    return current


def extract_normative_mentions(text: str) -> list[str]:
    pattern = re.compile(r"(Ley\s+\d+|Decreto\s+\d+|Artículo\s+\d+)", re.IGNORECASE)
    return pattern.findall(text)
