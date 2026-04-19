from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator


class AttachmentIn(BaseModel):
    bucket: str
    path: str
    name: str
    size: int
    mimeType: str


class NormalPayloadIn(BaseModel):
    person_type: str
    doc_type: str = ""
    doc_number: str = ""
    email: EmailStr
    confirm_email: EmailStr
    accept_policy: bool
    full_name: str
    gender: str
    department: str
    city: str
    address: str
    subject: str
    phone: str
    incident_address: str
    preferential_attention: bool = False
    information_request: bool = False
    notifications: bool = False
    description: str
    verification_check: bool
    accept_terms: bool
    attachments_count: int = Field(default=0, ge=0, le=5)

    @field_validator("confirm_email")
    @classmethod
    def emails_must_match(cls, value: str, info):
        email = info.data.get("email")
        if email and email != value:
            raise ValueError("Los correos no coinciden")
        return value


class AnonymousPayloadIn(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    subject: str
    description: str
    incident_address: str
    authorize_information: bool
    accept_terms: bool
    attachments_count: int = Field(default=0, ge=0, le=5)

    @field_validator("email", "phone", mode="before")
    @classmethod
    def empty_optional_fields_to_none(cls, value: str | None):
        if isinstance(value, str) and not value.strip():
            return None
        return value


class CreateNormalRequest(BaseModel):
    payload: NormalPayloadIn
    attachments: list[AttachmentIn] = Field(default_factory=list)


class CreateAnonymousRequest(BaseModel):
    payload: AnonymousPayloadIn
    attachments: list[AttachmentIn] = Field(default_factory=list)


class CreateResponse(BaseModel):
    success: bool
    message: str
    trackingId: str


class AgentFlowSummary(BaseModel):
    request_id: str
    tracking_id: str
    departamento: str
    estado: str
    es_competencia_secretaria: bool
    motivo_no_competencia: str
    detalle_competencia: str
    sentimiento_label: str
    sentimiento_score: float
    tipo_peticion: str
    dias_limite_ley_1755: int
    fecha_limite_respuesta: str
    requiere_humano: bool
    razon_revision: str
    borrador_respuesta: str
    fragmento_competente: str
    fuera_competencia: list[str] = Field(default_factory=list)
    normativas_halladas: list[dict] = Field(default_factory=list)
    fuentes_gov_permitidas: list[str] = Field(default_factory=list)


class AgentFlowRunResponse(BaseModel):
    success: bool
    message: str
    data: AgentFlowSummary
