from __future__ import annotations

from pydantic import BaseModel, Field, ValidationError

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from src.infrastructure.config.settings import Settings


class LlmTriageResult(BaseModel):
    es_competencia_secretaria: bool = Field(
        description="True when at least one substantial part is in Secretaria de Desarrollo Economico scope."
    )
    detalle_competencia: str = Field(
        description="Clear explanation of why it is in scope or out of scope."
    )
    motivo_no_competencia: str = Field(
        description="Non-empty only when out of scope."
    )
    fragmento_competente: str = Field(
        description="Only the in-scope fragment for Secretaria de Desarrollo Economico."
    )
    fuera_competencia: list[str] = Field(
        default_factory=list,
        description="Out-of-scope fragments that should be routed to other offices.",
    )
    indices_fragmento_competente: list[int] = Field(
        default_factory=list,
        description="1-based sentence indexes that are in scope for SDE.",
    )
    indices_fuera_competencia: list[int] = Field(
        default_factory=list,
        description="1-based sentence indexes that are out of scope for SDE.",
    )
    departamento: str = Field(
        description="Likely office. Use 'DesarrolloEconomico' if in scope, otherwise best external office label."
    )
    sentimiento_label: str = Field(
        description="One of: negativo, neutro, positivo"
    )
    sentimiento_score: float = Field(
        description="From -1.0 to 1.0"
    )
    tipo_peticion: str = Field(
        description="One of: informacion_documentos, consulta, peticion_general"
    )
    dias_limite_ley_1755: int = Field(
        description="10, 15 or 30 depending on request type under Law 1755."
    )


class LlmDraftResult(BaseModel):
    borrador_respuesta: str = Field(
        description="Draft institutional response in Spanish."
    )
    requiere_humano: bool = Field(
        description="True when legal support is weak or there is uncertainty."
    )
    razon_revision: str = Field(
        description="Review reason when requiere_humano is true, else empty string."
    )


def _build_model(settings: Settings, model_name: str) -> ChatGroq:
    if not settings.groq_api_key:
        raise RuntimeError(
            "Missing GROQ_API_KEY. Configure it to run the LLM agent flow."
        )

    return ChatGroq(
        model=model_name,
        api_key=settings.groq_api_key,
        temperature=0.1,
        timeout=20,
        max_retries=0,
    )


def _candidate_models(settings: Settings) -> list[str]:
    candidates = [settings.groq_model, *settings.groq_fallback_models]
    deduped: list[str] = []
    for item in candidates:
        if item and item not in deduped:
            deduped.append(item)
    return deduped


def _is_rate_limited(error_text: str) -> bool:
    markers = ["rate limit", "rate-limited", "too many requests", "429"]
    return any(marker in error_text for marker in markers)


def _is_model_not_found(error_text: str) -> bool:
    markers = ["model not found", "does not exist", "not available", "404"]
    return any(marker in error_text for marker in markers)


def _is_model_incompatible(error_text: str) -> bool:
    markers = [
        "invalid argument",
        "unsupported",
        "not supported",
        "developer instruction",
        "response format",
        "tool use is not supported",
    ]
    return any(marker in error_text for marker in markers)


def _extract_json_payload(text: str) -> str:
    payload = (text or "").strip()
    if payload.startswith("```"):
        lines = payload.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        payload = "\n".join(lines).strip()

    start = payload.find("{")
    end = payload.rfind("}")
    if start != -1 and end != -1 and end > start:
        payload = payload[start : end + 1]
    return payload


def _invoke_with_fallback(prompt: ChatPromptTemplate, schema: type[BaseModel], variables: dict):
    settings = Settings()
    models = _candidate_models(settings)
    rate_limit_errors: list[str] = []
    not_found_errors: list[str] = []
    parse_errors: list[str] = []
    incompatible_model_errors: list[str] = []
    provider_errors: list[str] = []

    for model_name in models:
        model = _build_model(settings, model_name)
        structured_chain = prompt | model.with_structured_output(schema)
        chain = prompt | model
        try:
            # Prefer native structured output so provider enforces schema.
            return structured_chain.invoke(variables)
        except ValidationError as exc:
            parse_errors.append(f"{model_name}: structured output validation error: {exc}")
            # Try manual extraction fallback below in case provider ignored schema contract.
        except Exception as exc:  # noqa: BLE001 - provider-specific exceptions vary by SDK.
            detail = str(exc).lower()
            if _is_rate_limited(detail):
                rate_limit_errors.append(f"{model_name}: {exc}")
                continue
            if _is_model_not_found(detail):
                not_found_errors.append(f"{model_name}: {exc}")
                continue
            if _is_model_incompatible(detail):
                incompatible_model_errors.append(f"{model_name}: {exc}")
                continue
            provider_errors.append(f"{model_name}: {exc}")
            continue

        try:
            response = chain.invoke(variables)
            content = response.content if hasattr(response, "content") else str(response)
            json_payload = _extract_json_payload(str(content))
            return schema.model_validate_json(json_payload)
        except ValidationError as exc:
            parse_errors.append(f"{model_name}: manual json parse error: {exc}")
            continue
        except Exception as exc:  # noqa: BLE001 - provider-specific exceptions vary by SDK.
            detail = str(exc).lower()
            if _is_rate_limited(detail):
                rate_limit_errors.append(f"{model_name}: {exc}")
                continue
            if _is_model_not_found(detail):
                not_found_errors.append(f"{model_name}: {exc}")
                continue
            if _is_model_incompatible(detail):
                incompatible_model_errors.append(f"{model_name}: {exc}")
                continue
            provider_errors.append(f"{model_name}: {exc}")
            continue

    if not_found_errors and not rate_limit_errors:
        tried_models = ", ".join(models)
        raise RuntimeError(
            "Groq could not find configured models. "
            f"Tried: {tried_models}. Set GROQ_MODEL/GROQ_FALLBACK_MODELS with available models."
        )

    if rate_limit_errors:
        tried_models = ", ".join(models)
        raise RuntimeError(
            "Groq rate-limited on all configured models. "
            f"Tried: {tried_models}. Configure GROQ_FALLBACK_MODELS or retry shortly."
        )

    if incompatible_model_errors:
        tried_models = ", ".join(models)
        raise RuntimeError(
            "Groq models were incompatible with required instructions/response format. "
            f"Tried: {tried_models}. Update GROQ_FALLBACK_MODELS to compatible models."
        )

    if parse_errors:
        tried_models = ", ".join(models)
        first_error = parse_errors[0]
        raise RuntimeError(
            "Groq responses could not be parsed as valid JSON for the expected schema. "
            f"Tried: {tried_models}. First parse error: {first_error}"
        )

    if provider_errors:
        tried_models = ", ".join(models)
        first_error = provider_errors[0]
        raise RuntimeError(
            "Groq provider errors on all configured models. "
            f"Tried: {tried_models}. First error: {first_error}"
        )

    raise RuntimeError("LLM invocation failed with unknown error.")


def run_llm_triage(
    citizen_text: str,
    competencia_context: str,
    deterministic_context: str,
    numbered_sentences: str,
) -> LlmTriageResult:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are a legal triage assistant for Medellin public PQRS.
Your primary task is binary ownership for Secretaria de Desarrollo Economico (SDE):
Does this request belong to SDE or not?

Hard rules:
1) If the complaint is fully about roads, potholes, security, mobility, health, education, taxes, utilities, or infrastructure, classify as OUT OF SCOPE.
2) If the complaint is mixed, keep ONLY the in-scope part in fragmento_competente and list external parts in fuera_competencia.
3) Be explicit and concise in detalle_competencia.
4) tipo_peticion must be exactly one: informacion_documentos, consulta, peticion_general.
5) dias_limite_ley_1755 must be one of: 10, 15, 30.
6) sentimiento_label must be one of: negativo, neutro, positivo.
7) departamento must be DesarrolloEconomico when in scope.
8) Use deterministic_context as supporting evidence, but do not copy it blindly.
9) Output must be strictly valid JSON for the requested schema (no markdown fences, no prose).
10) For segmentation, use the numbered sentence list and return exact extractive selection via:
    - indices_fragmento_competente
    - indices_fuera_competencia
    Do not invent sentence indexes outside the provided range.

Return valid JSON only through the schema.
""".strip(),
            ),
            (
                "human",
                """
Competence reference:
{competencia_context}

Deterministic support evidence:
{deterministic_context}

Numbered sentence list (use these indexes for segmentation):
{numbered_sentences}

Citizen request:
{citizen_text}
""".strip(),
            ),
        ]
    )

    return _invoke_with_fallback(
        prompt=prompt,
        schema=LlmTriageResult,
        variables={
            "competencia_context": competencia_context,
            "deterministic_context": deterministic_context,
            "numbered_sentences": numbered_sentences,
            "citizen_text": citizen_text,
        },
    )


def run_llm_drafter(
    citizen_text: str,
    out_of_scope_text: str,
    tracking_id: str,
    created_at: str,
    sentimiento_label: str,
    sentimiento_score: float,
    tipo_peticion: str,
    dias_limite: int,
    fecha_limite: str,
    legal_context: str,
) -> LlmDraftResult:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You draft formal responses for Secretaria de Desarrollo Economico.

Hard rules:
1) Write the final draft in Spanish.
2) Use only the provided legal context. Do not invent laws, decrees, or articles.
3) If legal context is weak, set requiere_humano=true and explain why.
4) Keep a respectful institutional tone and include next procedural step.
5) The draft must actively address BOTH:
    - what SDE can do directly (in-scope)
    - what is out of scope, with a concrete internal referral/transfer orientation.
6) Do not center the response around legal deadline; include deadline only as secondary note.
6) Output must be strictly valid JSON for the requested schema (no markdown fences, no prose).
7) borrador_respuesta must be plain institutional letter text, NOT a JSON object, NOT key-value payload.
8) Do not invent IDs, citizen names, placeholders, or synthetic fields like asunto/mensaje/procedimiento/next_step.
9) If uncertain, keep the draft concise and set requiere_humano=true.
10) Organizational accuracy is mandatory:
    - Subsecretaria de Desarrollo Rural and UMATA are INTERNAL to SDE.
    - Never "pass the ball" to those internal units as if they were external entities.
11) If out_of_scope_text includes roads/infrastructure topics, include explicit transfer language under Articulo 21 de la Ley 1755 de 2015.
12) Follow this exact response structure in borrador_respuesta:
    - Encabezado: ciudadano, numero de radicado (tracking_id) y fecha.
    - Parrafo 1 (Empatia): acknowledge frustration, especially if sentimiento is negativo.
    - Parrafo 2 (Lo que si hacemos): confirm SDE responsibility including Subsecretaria de Desarrollo Rural/UMATA and commit a concrete action.
    - Parrafo 3 (Banco Distrital): mention review of financial alternatives (e.g., alivio/refinanciacion) when relevant.
    - Parrafo 4 (Traslado): only for truly out-of-scope components, with Art. 21 transfer statement.
    - Cierre institucional.

Return valid JSON only through the schema.
""".strip(),
            ),
            (
                "human",
                """
Citizen text (in scope):
{citizen_text}

Out-of-scope fragments to address with referral/orientation:
{out_of_scope_text}

Tracking ID: {tracking_id}
Request created_at: {created_at}
Sentiment label: {sentimiento_label}
Sentiment score: {sentimiento_score}

Request type: {tipo_peticion}
Legal days: {dias_limite}
Estimated deadline: {fecha_limite}

Legal context:
{legal_context}
""".strip(),
            ),
        ]
    )

    return _invoke_with_fallback(
        prompt=prompt,
        schema=LlmDraftResult,
        variables={
            "citizen_text": citizen_text,
            "out_of_scope_text": out_of_scope_text,
            "tracking_id": tracking_id,
            "created_at": created_at,
            "sentimiento_label": sentimiento_label,
            "sentimiento_score": sentimiento_score,
            "tipo_peticion": tipo_peticion,
            "dias_limite": dias_limite,
            "fecha_limite": fecha_limite,
            "legal_context": legal_context,
        },
    )