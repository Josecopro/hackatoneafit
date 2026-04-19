from __future__ import annotations

from datetime import datetime

from src.application.agent_flow.llm_chain import run_llm_drafter, run_llm_triage
from src.application.agent_flow.knowledge_base import (
    ALLOWED_GOV_SOURCES,
    legal_context_for,
)
from src.application.agent_flow.state import AgentState
from src.application.agent_flow.tools import (
    add_business_days,
    classify_request_type,
    classify_sentiment,
    evaluate_belonging_signals,
    extract_secretaria_competence,
    sanitize_personal_data,
    sanitize_personal_data_list,
    split_sentences,
    summarize_out_of_scope_topics,
)


def _looks_like_payload_instead_of_letter(text: str) -> bool:
    candidate = (text or "").strip()
    if not candidate:
        return True

    if candidate.startswith("{") and candidate.endswith("}"):
        return True

    lowered = candidate.lower()
    forbidden_markers = [
        '"id"',
        '"asunto"',
        '"mensaje"',
        '"procedimiento"',
        '"next_step"',
        '"legal_deadline"',
        "[nombre del ciudadano]",
    ]
    return any(marker in lowered for marker in forbidden_markers)


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

    competencia_context_items = legal_context_for("DesarrolloEconomico")
    competencia_context = "\n".join(
        [f"- {item['source']}: {item['snippet']}" for item in competencia_context_items]
    )

    deterministic_signal = evaluate_belonging_signals(state.texto_original)
    det_fragment, det_outside, det_belongs, det_reason = extract_secretaria_competence(
        state.texto_original
    )
    sentences = split_sentences(state.texto_original)
    numbered_sentences = "\n".join(
        [f"{index + 1}. {sentence}" for index, sentence in enumerate(sentences)]
    )

    # Agent 1: Hybrid triage (LLM + deterministic support)
    triage_error = ""
    try:
        triage = run_llm_triage(
            citizen_text=state.texto_original,
            competencia_context=competencia_context,
            deterministic_context=deterministic_signal["summary"],
            numbered_sentences=numbered_sentences,
        )

        llm_belongs = triage.es_competencia_secretaria
        final_belongs = llm_belongs
        if deterministic_signal["strong_belongs"] and not llm_belongs:
            final_belongs = True
        if deterministic_signal["strong_not_belongs"] and not llm_belongs:
            final_belongs = False
        if not llm_belongs and det_belongs:
            final_belongs = True

        state.es_competencia_secretaria = final_belongs
        state.departamento = (
            "DesarrolloEconomico" if final_belongs else "NoCompetenciaSDE"
        )

        # Keep segmentation extractive with exact user wording, but selected by LLM indexes.
        valid_range = set(range(1, len(sentences) + 1))
        in_idx = [i for i in triage.indices_fragmento_competente if i in valid_range]
        out_idx = [i for i in triage.indices_fuera_competencia if i in valid_range]

        if in_idx or out_idx:
            in_set = set(in_idx)
            out_set = set(out_idx)
            # If same sentence appears in both, prioritize in-scope when LLM says request belongs to SDE.
            overlap = in_set & out_set
            if overlap and state.es_competencia_secretaria:
                out_set -= overlap
            if overlap and not state.es_competencia_secretaria:
                in_set -= overlap

            # Guardrail: keep out-of-scope-only sentences out of the competent fragment.
            for sentence_index in list(in_set):
                sentence_text = sentences[sentence_index - 1]
                sentence_signal = evaluate_belonging_signals(sentence_text)
                if (
                    sentence_signal["strong_not_belongs"]
                    and not sentence_signal["belongs"]
                ):
                    in_set.discard(sentence_index)
                    out_set.add(sentence_index)

            selected_in = [sentences[i - 1] for i in sorted(in_set)]
            selected_out = [sentences[i - 1] for i in sorted(out_set)]

            if selected_in:
                state.fragmento_competente = " ".join(selected_in)
            else:
                state.fragmento_competente = det_fragment

            if selected_out:
                state.fuera_competencia = selected_out
            else:
                state.fuera_competencia = det_outside
        else:
            state.fragmento_competente = det_fragment
            state.fuera_competencia = det_outside

        state.detalle_competencia = (
            f"LLM: {triage.detalle_competencia} | Deterministic: {deterministic_signal['summary']}"
        )
        state.sentimiento_label = triage.sentimiento_label
        state.sentimiento_score = triage.sentimiento_score
        state.tipo_peticion = triage.tipo_peticion
        legal_days = (
            triage.dias_limite_ley_1755
            if triage.dias_limite_ley_1755 in {10, 15, 30}
            else 15
        )
        state.motivo_no_competencia = triage.motivo_no_competencia
    except RuntimeError as exc:
        triage_error = str(exc)
        state.es_competencia_secretaria = bool(det_belongs)
        state.departamento = (
            "DesarrolloEconomico" if state.es_competencia_secretaria else "NoCompetenciaSDE"
        )
        state.fragmento_competente = det_fragment
        state.fuera_competencia = det_outside
        state.detalle_competencia = (
            "LLM unavailable, deterministic fallback active. "
            f"Reason: {triage_error}. Signals: {deterministic_signal['summary']}"
        )
        state.sentimiento_label, state.sentimiento_score = classify_sentiment(
            state.texto_original
        )
        state.tipo_peticion, legal_days = classify_request_type(state.texto_original)
        if not state.es_competencia_secretaria:
            state.motivo_no_competencia = (
                "Clasificacion por respaldo determinista: no pertenece a la Secretaria de Desarrollo Economico. "
                f"{det_reason}"
            )

    base_date = datetime.utcnow().date()
    state.set_deadline(add_business_days(base_date, legal_days), legal_days)
    state.estado = "in_review"

    # If the request is out of scope for this Secretaría, stop processing.
    if not state.es_competencia_secretaria:
        state.estado = "closed"
        state.requiere_humano = True
        state.motivo_no_competencia = (
            state.motivo_no_competencia
            or "La PQRS no contiene componentes de competencia de la Secretaria de Desarrollo Economico."
        )
        if det_reason:
            state.motivo_no_competencia = (
                f"{state.motivo_no_competencia} Soporte determinista: {det_reason}"
            )
        out_topics = summarize_out_of_scope_topics(state.texto_original)
        topics_line = ", ".join(out_topics) if out_topics else "dependencias competentes"
        state.borrador_respuesta = (
            f"Ciudadano/a - Radicado {state.tracking_id or state.request_id} - Fecha {state.created_at or datetime.utcnow().date().isoformat()}\n\n"
            "Recibimos su comunicacion y comprendemos la importancia de su situacion.\n\n"
            "Tras la verificacion inicial, se concluye que los hechos descritos no corresponden a competencia directa de esta Secretaria. "
            "En consecuencia, procederemos con el traslado por competencia a la autoridad correspondiente, conforme al Articulo 21 de la Ley 1755 de 2015.\n\n"
            f"El traslado incluira los componentes asociados a {topics_line}, con trazabilidad para su seguimiento.\n\n"
            "Cordialmente,\n"
            "Secretaria de Desarrollo Economico\n"
            "Alcaldia de Medellin"
        )
        state.normativas_halladas = []
        state.respuestas_oro_halladas = []
        state.sin_contexto_legal = True
        state.razon_revision = "Requiere verificacion humana del traslado a dependencias competentes."
        state.ciclos_correccion = 0
        state.fragmento_competente = sanitize_personal_data(state.fragmento_competente)
        state.fuera_competencia = sanitize_personal_data_list(state.fuera_competencia)
        state.borrador_respuesta = sanitize_personal_data(state.borrador_respuesta)
        return state

    # Agent 2: legal context retrieval
    state.normativas_halladas = legal_context_for(state.departamento)
    state.respuestas_oro_halladas = [
        {
            "source": "Fuentes .gov.co permitidas",
            "snippet": "Solo se permiten fuentes oficiales de la Secretaría de Desarrollo Económico.",
            "urls": ALLOWED_GOV_SOURCES,
        }
    ]
    state.sin_contexto_legal = len(state.normativas_halladas) == 0

    # Agent 3: LLM drafting
    legal_context_text = "\n".join(
        [
            f"- {item['source']}: {item['snippet']}"
            for item in state.normativas_halladas
        ]
    )
    try:
        draft = run_llm_drafter(
            citizen_text=state.fragmento_competente or state.texto_original,
            out_of_scope_text="\n".join(state.fuera_competencia) if state.fuera_competencia else "",
            tracking_id=state.tracking_id or state.request_id,
            created_at=state.created_at or datetime.utcnow().date().isoformat(),
            sentimiento_label=state.sentimiento_label,
            sentimiento_score=state.sentimiento_score,
            tipo_peticion=state.tipo_peticion,
            dias_limite=state.dias_limite_ley_1755,
            fecha_limite=state.fecha_limite_respuesta,
            legal_context=legal_context_text,
        )

        if _looks_like_payload_instead_of_letter(draft.borrador_respuesta):
            out_topics = summarize_out_of_scope_topics(state.texto_original)
            topics_line = ", ".join(out_topics) if out_topics else "dependencias competentes"
            state.borrador_respuesta = (
                f"Ciudadano/a - Radicado {state.tracking_id or state.request_id} - Fecha {state.created_at or datetime.utcnow().date().isoformat()}\n\n"
                "Reconocemos la importancia de su solicitud y la necesidad de una atencion clara y oportuna.\n\n"
                "Esta Secretaria gestionara de manera directa los componentes de su caso que correspondan a Desarrollo Economico, "
                "incluyendo las actuaciones internas con la Subsecretaria de Desarrollo Rural y UMATA cuando aplique.\n\n"
                f"Los componentes fuera de competencia se trasladaran formalmente a {topics_line}, conforme al Articulo 21 de la Ley 1755 de 2015.\n\n"
                "La comunicacion final sera validada por equipo humano para asegurar precision juridica y administrativa.\n\n"
                "Cordialmente,\n"
                "Secretaria de Desarrollo Economico\n"
                "Alcaldia de Medellin"
            )
            state.requiere_humano = True
            state.razon_revision = (
                "LLM draft returned non-letter payload format; human legal review required."
            )
        else:
            state.borrador_respuesta = draft.borrador_respuesta
            state.requiere_humano = draft.requiere_humano
            state.razon_revision = draft.razon_revision
    except RuntimeError as exc:
        out_topics = summarize_out_of_scope_topics(state.texto_original)
        topics_line = ", ".join(out_topics) if out_topics else "dependencias competentes"
        state.borrador_respuesta = (
            f"Ciudadano/a - Radicado {state.tracking_id or state.request_id} - Fecha {state.created_at or datetime.utcnow().date().isoformat()}\n\n"
            "Comprendemos la relevancia de su solicitud y ofrecemos disculpas por la demora asociada a una contingencia tecnica temporal.\n\n"
            "Esta Secretaria iniciara la gestion directa de los componentes de su caso bajo competencia de Desarrollo Economico, "
            "incluyendo la articulacion interna con la Subsecretaria de Desarrollo Rural y UMATA cuando corresponda.\n\n"
            f"Los componentes fuera de competencia se trasladaran a {topics_line}, conforme al Articulo 21 de la Ley 1755 de 2015, "
            "con trazabilidad para su seguimiento.\n\n"
            "Cordialmente,\nSecretaria de Desarrollo Economico\nAlcaldia de Medellin"
        )
        state.requiere_humano = True
        state.razon_revision = (
            "LLM drafting unavailable; human legal review required. "
            f"Reason: {exc}"
        )

    state.ciclos_correccion = 1
    state.placeholders_usados = False
    if not state.requiere_humano:
        state.estado = "closed"

    state.fragmento_competente = sanitize_personal_data(state.fragmento_competente)
    state.fuera_competencia = sanitize_personal_data_list(state.fuera_competencia)
    state.borrador_respuesta = sanitize_personal_data(state.borrador_respuesta)

    return state
