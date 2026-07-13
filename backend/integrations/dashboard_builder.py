import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", ".."),
)

from backend.integrations.meta_ads import (
    extrair_metricas,
    get_account_insights,
    get_campaigns_insights,
)
from backend.integrations.supabase import get_client
from schemas.dashboard import (
    DashboardSnapshot,
    MetricasAnuncios,
    MetricasCRM,
)


def _calcular_inicio_periodo(
    periodo: str,
) -> datetime | None:
    agora = datetime.now(timezone.utc)

    periodos = {
        "last_7d": 7,
        "last_14d": 14,
        "last_30d": 30,
        "last_90d": 90,
    }

    dias = periodos.get(periodo)

    if dias is None:
        return None

    return agora - timedelta(days=dias)


def _get_crm_metricas(periodo: str) -> dict:
    """
    Busca métricas do CRM para os leads criados dentro do período.

    Para períodos não reconhecidos, utiliza todos os registros.
    """
    client = get_client()

    query = client.table("leads").select(
        "status,criado_em"
    )

    inicio_periodo = _calcular_inicio_periodo(periodo)

    if inicio_periodo:
        query = query.gte(
            "criado_em",
            inicio_periodo.isoformat(),
        )

    leads = query.execute().data or []

    novos = sum(
        1 for lead in leads
        if lead.get("status") == "novo"
    )
    qualificados = sum(
        1 for lead in leads
        if lead.get("status") == "qualificado"
    )
    em_negociacao = sum(
        1 for lead in leads
        if lead.get("status") == "em_negociacao"
    )
    fechados = sum(
        1 for lead in leads
        if lead.get("status") == "fechado"
    )
    perdidos = sum(
        1 for lead in leads
        if lead.get("status") == "perdido"
    )

    total = (
        novos
        + qualificados
        + em_negociacao
        + fechados
        + perdidos
    )

    leads_avancados = (
        qualificados
        + em_negociacao
        + fechados
    )

    taxa_qualificacao = (
        round(leads_avancados / total, 4)
        if total > 0
        else 0.0
    )

    taxa_fechamento = (
        round(fechados / leads_avancados, 4)
        if leads_avancados > 0
        else 0.0
    )

    return {
        "periodo": periodo,
        "leads_novos": novos,
        "leads_qualificados": qualificados,
        "leads_em_negociacao": em_negociacao,
        "leads_fechados": fechados,
        "leads_perdidos": perdidos,
        "taxa_qualificacao": taxa_qualificacao,
        "taxa_fechamento": taxa_fechamento,
    }


def build_snapshot(
    date_preset: str = "last_7d",
) -> DashboardSnapshot:
    """
    Constrói o snapshot consolidado de Meta Ads e CRM.
    """
    agora = datetime.now(timezone.utc)
    semana = agora.strftime("%G-W%V")
    gerado_em = agora.isoformat()

    print("   Buscando insights Meta Ads...")

    (
        insights_raw,
        periodo_utilizado,
        aviso,
    ) = get_account_insights(date_preset)

    campanhas_raw = get_campaigns_insights(
        periodo_utilizado
    )

    metricas_meta = extrair_metricas(
        insights=insights_raw,
        campanhas=campanhas_raw,
        periodo_solicitado=date_preset,
        periodo_utilizado=periodo_utilizado,
    )

    print("   Buscando métricas do CRM...")

    crm_raw = _get_crm_metricas(
        periodo_utilizado
    )

    gasto = metricas_meta["gasto"]

    leads_qualificados = (
        crm_raw["leads_qualificados"]
        + crm_raw["leads_em_negociacao"]
        + crm_raw["leads_fechados"]
    )

    leads_fechados = crm_raw["leads_fechados"]

    custo_lead_qualificado = (
        round(gasto / leads_qualificados, 2)
        if leads_qualificados > 0
        else 0.0
    )

    custo_lead_fechado = (
        round(gasto / leads_fechados, 2)
        if leads_fechados > 0
        else 0.0
    )

    return DashboardSnapshot(
        semana=semana,
        gerado_em=gerado_em,
        anuncios=MetricasAnuncios(**metricas_meta),
        crm=MetricasCRM(
            custo_lead_qualificado=custo_lead_qualificado,
            custo_lead_fechado=custo_lead_fechado,
            **crm_raw,
        ),
        aviso=aviso,
    )