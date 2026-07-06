# schemas/content.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from backend.models.enums import Pilar, FormatoConteudo, StatusRevisao


class SlideCarrossel(BaseModel):
    ordem: int
    texto: str


class RoteiroConteudo(BaseModel):
    hook: str = Field(..., description="Primeiros 3 segundos — para o scroll")
    desenvolvimento: list[str] = Field(
        ...,
        description="Parágrafos ou marcadores do corpo"
    )
    cta: str = Field(..., description="Chamada para ação final")
    slides: Optional[list[SlideCarrossel]] = Field(
        default=None,
        description="Preenchido apenas quando formato=carrossel"
    )


class ContentOutput(BaseModel):
    data: str
    gerado_em: datetime
    pilar: Pilar
    formato: FormatoConteudo
    titulo_interno: str
    roteiro: RoteiroConteudo
    hashtags: list[str] = Field(default_factory=list, max_length=15)
    compliance_checou: bool
    revisao_humana: StatusRevisao = Field(default=StatusRevisao.PENDENTE)

    model_config = {"json_encoders": {datetime: lambda v: v.isoformat()}}