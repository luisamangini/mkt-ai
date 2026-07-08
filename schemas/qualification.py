from typing import Optional

from pydantic import BaseModel, Field

from backend.models.enums import PrioridadeLead, StatusLead


class QualificationAction(BaseModel):
    """Ação sugerida para um lead específico."""

    lead_id: str
    lead_nome: str
    prioridade: PrioridadeLead

    acao_sugerida: str = Field(
        ...,
        description="Instrução clara para o operador sobre o que fazer com este lead",
    )

    proximo_passo: str = Field(
        ...,
        description="Próximo passo contextual baseado nas informações do lead",
    )

    mensagem_reengajamento: Optional[str] = Field(
        default=None,
        description="Texto pronto para enviar ao lead pelo WhatsApp",
    )

    novo_status_sugerido: Optional[StatusLead] = None

    registrar_no_historico: str = Field(
        ...,
        description="Texto gravado automaticamente no histórico do lead",
    )

    executar: bool = Field(
        default=False,
        description="Sempre False. O operador aprova antes de agir.",
    )


class QualificationOutput(BaseModel):
    """Saída completa do Agente de Qualificação."""

    data: str
    total_leads_analisados: int
    acoes: list[QualificationAction]
    leads_prioritarios: int
    leads_frios: int
    resumo: str