from __future__ import annotations

from datetime import datetime

from src.application.agent_flow.knowledge_base import (
    ALLOWED_GOV_SOURCES,
    legal_context_for,
)
from src.application.agent_flow.state import AgentState
from src.application.agent_flow.tools import (
    add_business_days,
    classify_department,
    classify_request_type,
    classify_sentiment,
    extract_normative_mentions,
    extract_secretaria_competence,
    sanitize_personal_data,
    sanitize_personal_data_list,
    summarize_out_of_scope_topics,
)


def run_minimal_agent_flow(request_record: dict) -> AgentState:
    payload = request_record.get("payload") or {}
    text = str(payload.get("description") or request_record.get("description") or "")

    state = AgentState(
        request_id=str(request_record["id"]),
        tracking_id=str(request_record.get("tracking_id") or ""),
        texto_original=text,
        payload=payload,
        created_at=str(request_record.get("created_at") or ""),
    )

    # Agent 1: triage + competence extraction (secretaría de desarrollo económico)
    fragment, outside, is_competence, competence_detail = extract_secretaria_competence(
        state.texto_original
    )
    state.fragmento_competente = fragment
    state.fuera_competencia = outside
    state.es_competencia_secretaria = is_competence
    state.detalle_competencia = competence_detail
    state.departamento = classify_department(
        fragment if fragment else state.texto_original
    )
    state.estado = "in_review"

    # If the request is out of scope for this Secretaría, stop processing.
    if not state.es_competencia_secretaria:
        state.estado = "closed"
        state.requiere_humano = False
        out_topics = summarize_out_of_scope_topics(state.texto_original)
        if out_topics:
            state.motivo_no_competencia = (
                "La PQRS no contiene componentes de competencia de la Secretaria de Desarrollo Economico. "
                f"Temas detectados fuera de alcance: {', '.join(out_topics)}."
            )
        else:
            state.motivo_no_competencia = (
                "La PQRS no contiene componentes de competencia de la Secretaria de Desarrollo Economico."
            )
        state.borrador_respuesta = ""
        state.normativas_halladas = []
        state.respuestas_oro_halladas = []
        state.sin_contexto_legal = True
        state.razon_revision = ""
        state.ciclos_correccion = 0
        state.fragmento_competente = sanitize_personal_data(state.fragmento_competente)
        state.fuera_competencia = sanitize_personal_data_list(state.fuera_competencia)
        return state

    # Sentiment + legal due days (keeps citizen text intact)
    sentiment_label, sentiment_score = classify_sentiment(state.texto_original)
    state.sentimiento_label = sentiment_label
    state.sentimiento_score = sentiment_score

    req_type, legal_days = classify_request_type(state.texto_original)
    state.tipo_peticion = req_type
    base_date = datetime.utcnow().date()
    state.set_deadline(add_business_days(base_date, legal_days), legal_days)

    # Agent 2: investigador (open deterministic baseline)
    state.normativas_halladas = legal_context_for(state.departamento)
    state.respuestas_oro_halladas = [
        {
            "source": "Fuentes .gov.co permitidas",
            "snippet": "Solo se permiten fuentes oficiales de la Secretaría de Desarrollo Económico.",
            "urls": ALLOWED_GOV_SOURCES,
        }
    ]
    state.sin_contexto_legal = len(state.normativas_halladas) == 0

    # Agent 3: redactor
    legal_block = ""
    if state.sin_contexto_legal:
        legal_block = "[[INSERTAR_NORMATIVA_AQUI]]"
        state.placeholders_usados = True
    else:
        legal_block = "\n".join(
            [
                f"- {item['source']}: {item['snippet']}"
                for item in state.normativas_halladas
            ]
        )

    state.borrador_respuesta = (
        "Respetado ciudadano/a,\n\n"
        "Hemos recibido su petición y, para competencia de la Secretaría de Desarrollo Económico, "
        "atenderemos los aspectos relacionados con emprendimiento, empleo y fortalecimiento empresarial.\n\n"
        f"Fundamento legal aplicable:\n{legal_block}\n\n"
        f"Respuesta concreta: su caso se clasifica como '{state.tipo_peticion}' con plazo legal estimado "
        f"de {state.dias_limite_ley_1755} días hábiles (fecha límite estimada: {state.fecha_limite_respuesta}). "
        "Se realizará validación técnica interna y se emitirá respuesta formal por el canal registrado.\n\n"
        "Cordialmente,\n"
        "Secretaría de Desarrollo Económico\n"
        "Alcaldía de Medellín"
    )

    # Agent 4: validador jurídico determinista
    mentions = extract_normative_mentions(state.borrador_respuesta)
    allowed_sources_text = " ".join(
        [item["source"] for item in state.normativas_halladas]
    ).lower()

    hallucination = False
    for mention in mentions:
        if mention.lower() not in allowed_sources_text:
            hallucination = True
            break

    if (
        state.sin_contexto_legal
        and mentions
        and "[[INSERTAR_NORMATIVA_AQUI]]" not in state.borrador_respuesta
    ):
        hallucination = True

    if len(state.borrador_respuesta.strip()) < 100:
        hallucination = True

    if hallucination:
        state.requiere_humano = True
        state.razon_revision = (
            "Posible alucinación legal o soporte normativo insuficiente."
        )
        state.ciclos_correccion = 1
    else:
        state.requiere_humano = False
        state.razon_revision = ""
        state.ciclos_correccion = 1
        state.estado = "closed"

    state.fragmento_competente = sanitize_personal_data(state.fragmento_competente)
    state.fuera_competencia = sanitize_personal_data_list(state.fuera_competencia)
    state.borrador_respuesta = sanitize_personal_data(state.borrador_respuesta)

    return state
