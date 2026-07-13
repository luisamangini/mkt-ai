from typing import Optional

from pydantic import BaseModel, Field


class AnalysisOutput(BaseModel):
    semana: str
    gerado_em: str

    situacao_geral: str = Field(
        ...,
        description="Diagnóstico geral em duas ou três frases",
    )

    destaque_positivo: str = Field(
        ...,
        description="Principal resultado positivo identificado",
    )

    alerta: Optional[str] = Field(
        default=None,
        description="Principal ponto de atenção",
    )

    melhor_campanha: str = Field(
        ...,
        description="Melhor campanha ou aviso de dados insuficientes",
    )

    pior_campanha: str = Field(
        ...,
        description="Pior campanha ou aviso de dados insuficientes",
    )

    recomendacoes: list[str] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="Recomendações específicas e acionáveis",
    )

    resumo_email: str = Field(
        default="",
        description=(
            "Corpo do e-mail. Será preenchido posteriormente pela API."
        ),
    )