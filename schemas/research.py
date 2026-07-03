from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from backend.models.enums import Pilar, Relevancia, StatusAgente


class FonteNoticia(BaseModel):
    titulo: str
    url: str


class TemaResearch(BaseModel):
    titulo: str = Field(..., description="Título curto do tema encontrado")
    resumo: str = Field(..., description="Resumo em 2-4 frases")
    angulo_sugerido: str = Field(..., description="Como usar este tema no conteúdo")
    pilar_sugerido: Pilar
    relevancia: Relevancia
    fontes: list[FonteNoticia] = Field(default_factory=list)


class ResearchOutput(BaseModel):
    data: str
    gerado_em: datetime
    temas: list[TemaResearch] = Field(default_factory=list, max_length=3)
    status: StatusAgente
    erro: Optional[str] = None

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }
    