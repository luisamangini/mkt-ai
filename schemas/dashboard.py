from typing import Optional

from pydantic import BaseModel, Field


class Campanha(BaseModel):
    nome: str = Field(..., description="Nome da campanha")
    gasto: float = Field(default=0.0, description="Valor gasto em reais")
    impressoes: int = Field(default=0)
    cliques: int = Field(default=0)
    ctr: float = Field(default=0.0, description="Taxa de cliques em porcentagem")
    cpm: float = Field(default=0.0, description="Custo por mil impressões")
    leads: int = Field(default=0)
    cpl: float = Field(default=0.0, description="Custo por lead")


class MetricasAnuncios(BaseModel):
    periodo_solicitado: str = Field(
        ...,
        description="Período originalmente solicitado",
    )
    periodo_utilizado: str = Field(
        ...,
        description="Período que efetivamente retornou dados",
    )
    gasto: float = Field(default=0.0)
    impressoes: int = Field(default=0)
    alcance: int = Field(default=0)
    cliques: int = Field(default=0)
    ctr: float = Field(default=0.0)
    cpm: float = Field(default=0.0)
    cpl_bruto: float = Field(default=0.0)
    leads_meta: int = Field(default=0)
    frequencia: float = Field(default=0.0)
    hook_rate: float = Field(
        default=0.0,
        description="Percentual de visualizações que atingiram 25% do vídeo",
    )
    campanhas: list[Campanha] = Field(default_factory=list)


class MetricasCRM(BaseModel):
    periodo: str
    leads_novos: int = Field(default=0)
    leads_qualificados: int = Field(default=0)
    leads_em_negociacao: int = Field(default=0)
    leads_fechados: int = Field(default=0)
    leads_perdidos: int = Field(default=0)
    taxa_qualificacao: float = Field(
        default=0.0,
        description="Taxa entre 0 e 1",
    )
    taxa_fechamento: float = Field(
        default=0.0,
        description="Taxa entre 0 e 1",
    )
    tempo_medio_fechamento_dias: Optional[float] = None
    custo_lead_qualificado: float = Field(default=0.0)
    custo_lead_fechado: float = Field(default=0.0)


class MetricasInstagram(BaseModel):
    username: str = ""
    seguidores: int = Field(default=0)
    total_posts: int = Field(default=0)
    alcance: int = Field(default=0)
    visualizacoes: int = Field(default=0)
    visitas_perfil: int = Field(default=0)

class DashboardSnapshot(BaseModel):
    semana: str
    gerado_em: str
    anuncios: MetricasAnuncios
    crm: MetricasCRM
    instagram: Optional[MetricasInstagram] = None
    aviso: Optional[str] = None