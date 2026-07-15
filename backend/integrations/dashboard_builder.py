import os
import sys
from datetime import datetime, timedelta, timezone
from backend.integrations.instagram import get_instagram_metricas


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
    MetricasInstagram,
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
        1
        for lead in leads
        if lead.get("status") == "novo"
    )

    qualificados = sum(
        1
        for lead in leads
        if lead.get("status") == "qualificado"
    )

    em_negociacao = sum(
        1
        for lead in leads
        if lead.get("status") == "em_negociacao"
    )

    fechados = sum(
        1
        for lead in leads
        if lead.get("status") == "fechado"
    )

    perdidos = sum(
        1
        for lead in leads
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
    Constrói o snapshot consolidado de Meta Ads, CRM e Instagram
    e persiste o resultado no Supabase.
    """
    agora = datetime.now(timezone.utc)
    ano_iso, semana_iso, _ = agora.isocalendar()

    semana = f"{ano_iso}-W{semana_iso:02d}"
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

    print("   Buscando métricas orgânicas do Instagram...")

    try:
        instagram_raw = get_instagram_metricas()
        instagram = MetricasInstagram(
            **instagram_raw
        )

    except Exception as exc:
        print(
            f"   Falha ao buscar métricas do Instagram: {exc} — "
            "continuando sem dados orgânicos"
        )
        instagram = None

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

    snapshot = DashboardSnapshot(
        semana=semana,
        gerado_em=gerado_em,
        anuncios=MetricasAnuncios(
            **metricas_meta
        ),
        crm=MetricasCRM(
            custo_lead_qualificado=(
                custo_lead_qualificado
            ),
            custo_lead_fechado=(
                custo_lead_fechado
            ),
            **crm_raw,
        ),
        instagram=instagram,
        aviso=aviso,
    )

    print("   Salvando snapshot no Supabase...")

    try:
        from backend.integrations.supabase import (
            salvar_snapshot,
        )

        salvar_snapshot(snapshot)

        print(
            f"   Snapshot {semana} salvo"
        )

    except Exception as exc:
        print(
            f"   Falha ao salvar snapshot: {exc} — "
            "continuando sem persistir"
        )

    return snapshot