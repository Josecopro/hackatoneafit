from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass
class AgentState:
    request_id: str
    tracking_id: str
    texto_original: str
    payload: dict
    created_at: str

    estado: str = "received"
    departamento: str = "General"
    fragmento_competente: str = ""
    fuera_competencia: list[str] = field(default_factory=list)
    es_competencia_secretaria: bool = False
    motivo_no_competencia: str = ""
    detalle_competencia: str = ""

    sentimiento_label: str = "neutro"
    sentimiento_score: float = 0.0
    tipo_peticion: str = "peticion_general"
    dias_limite_ley_1755: int = 15
    fecha_limite_respuesta: str = ""

    normativas_halladas: list[dict] = field(default_factory=list)
    respuestas_oro_halladas: list[dict] = field(default_factory=list)
    sin_contexto_legal: bool = False

    borrador_respuesta: str = ""
    requiere_humano: bool = False
    razon_revision: str = ""
    placeholders_usados: bool = False
    ciclos_correccion: int = 0

    def set_deadline(self, deadline: date, days: int) -> None:
        self.fecha_limite_respuesta = deadline.isoformat()
        self.dias_limite_ley_1755 = days
