import os
import sys
from typing import Any

import requests

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", ".."),
)

from backend.config.settings import META_ACCESS_TOKEN, META_AD_ACCOUNT_ID


BASE_URL = "https://graph.facebook.com/v25.0"


def _validar_configuracao() -> None:
    if not META_ACCESS_TOKEN:
        raise ValueError(
            "META_ACCESS_TOKEN não está configurado no ambiente."
        )

    if not META_AD_ACCOUNT_ID:
        raise ValueError(
            "META_AD_ACCOUNT_ID não está configurado no ambiente."
        )


def _get(
    endpoint: str,
    params: dict[str, Any] | None = None,
) -> dict:
    """
    Executa uma requisição GET para a Meta Graph API.

    Trata erros de timeout, conexão e respostas HTTP inválidas.
    """
    _validar_configuracao()

    parametros = dict(params or {})
    parametros["access_token"] = META_ACCESS_TOKEN

    try:
        resposta = requests.get(
            f"{BASE_URL}/{endpoint}",
            params=parametros,
            timeout=30,
        )

        dados = resposta.json()

        if not resposta.ok:
            erro = dados.get("error", dados)
            raise RuntimeError(
                f"Erro Meta API ({resposta.status_code}): {erro}"
            )

        return dados

    except requests.Timeout as exc:
        raise RuntimeError(
            "A Meta API excedeu o tempo limite da requisição."
        ) from exc

    except requests.ConnectionError as exc:
        raise RuntimeError(
            "Não foi possível conectar à Meta API."
        ) from exc

    except requests.RequestException as exc:
        raise RuntimeError(
            f"Erro inesperado ao consultar a Meta API: {exc}"
        ) from exc


def _buscar_insights(
    endpoint: str,
    params: dict[str, Any],
) -> list[dict]:
    dados = _get(endpoint, params)
    return dados.get("data", [])


def get_account_insights(
    date_preset: str = "last_7d",
) -> tuple[dict, str, str | None]:
    """
    Busca métricas agregadas da conta.

    Retorna:
        insights
        período efetivamente utilizado
        aviso sobre fallback ou ausência de dados
    """
    params = {
        "fields": (
            "spend,impressions,reach,clicks,ctr,cpm,frequency,"
            "actions,cost_per_action_type,"
            "video_p25_watched_actions,"
            "video_p100_watched_actions"
        ),
        "date_preset": date_preset,
        "level": "account",
    }

    resultados = _buscar_insights(
        f"{META_AD_ACCOUNT_ID}/insights",
        params,
    )

    if resultados:
        return resultados[0], date_preset, None

    if date_preset == "last_7d":
        print(
            "   Sem dados em last_7d — "
            "tentando last_30d como fallback"
        )

        params["date_preset"] = "last_30d"

        resultados_30 = _buscar_insights(
            f"{META_AD_ACCOUNT_ID}/insights",
            params,
        )

        if resultados_30:
            aviso = (
                "Sem gasto nos últimos 7 dias. "
                "Métricas baseadas nos últimos 30 dias."
            )
            return resultados_30[0], "last_30d", aviso

        aviso = (
            "Sem dados de anúncios nos últimos 7 e 30 dias. "
            "Conta sem gasto no período."
        )

        print(f"   {aviso}")
        return {}, date_preset, aviso

    aviso = f"Sem dados de anúncios para o período {date_preset}."
    return {}, date_preset, aviso


def get_campaigns_insights(
    date_preset: str,
) -> list[dict]:
    """
    Busca métricas das campanhas exatamente no período informado.

    O período utilizado deve ser o mesmo retornado por
    get_account_insights().
    """
    params = {
        "fields": (
            "campaign_name,spend,impressions,clicks,"
            "ctr,cpm,actions,cost_per_action_type"
        ),
        "date_preset": date_preset,
        "level": "campaign",
    }

    return _buscar_insights(
        f"{META_AD_ACCOUNT_ID}/insights",
        params,
    )


def _extrair_valor_acao(
    acoes: list[dict],
    tipos: set[str],
) -> int:
    for acao in acoes:
        if acao.get("action_type") in tipos:
            try:
                return int(float(acao.get("value", 0)))
            except (TypeError, ValueError):
                return 0

    return 0


def extrair_metricas(
    insights: dict,
    campanhas: list[dict],
    periodo_solicitado: str,
    periodo_utilizado: str,
) -> dict:
    """
    Normaliza as métricas da Meta API.

    Retorna valores zerados quando o período não possui dados.
    """
    if not insights:
        return {
            "periodo_solicitado": periodo_solicitado,
            "periodo_utilizado": periodo_utilizado,
            "gasto": 0.0,
            "impressoes": 0,
            "alcance": 0,
            "cliques": 0,
            "ctr": 0.0,
            "cpm": 0.0,
            "cpl_bruto": 0.0,
            "leads_meta": 0,
            "frequencia": 0.0,
            "hook_rate": 0.0,
            "campanhas": [],
        }

    tipos_lead = {
        "lead",
        "onsite_conversion.lead_grouped",
        "offsite_conversion.fb_pixel_lead",
    }

    acoes = insights.get("actions", [])
    leads = _extrair_valor_acao(acoes, tipos_lead)

    gasto = float(insights.get("spend", 0) or 0)
    impressoes = int(insights.get("impressions", 0) or 0)

    cpl = round(gasto / leads, 2) if leads > 0 else 0.0

    p25_actions = insights.get("video_p25_watched_actions", [])
    p25 = _extrair_valor_acao(
        p25_actions,
        {"video_view", "video_p25_watched_actions"},
    )

    if p25 == 0 and p25_actions:
        try:
            p25 = int(float(p25_actions[0].get("value", 0)))
        except (TypeError, ValueError, IndexError):
            p25 = 0

    hook_rate = (
        round((p25 / impressoes) * 100, 1)
        if impressoes > 0
        else 0.0
    )

    campanhas_normalizadas = []

    for campanha in campanhas:
        campanha_acoes = campanha.get("actions", [])
        campanha_leads = _extrair_valor_acao(
            campanha_acoes,
            tipos_lead,
        )

        campanha_gasto = float(
            campanha.get("spend", 0) or 0
        )

        campanha_cpl = (
            round(campanha_gasto / campanha_leads, 2)
            if campanha_leads > 0
            else 0.0
        )

        campanhas_normalizadas.append(
            {
                "nome": campanha.get("campaign_name", ""),
                "gasto": campanha_gasto,
                "impressoes": int(
                    campanha.get("impressions", 0) or 0
                ),
                "cliques": int(
                    campanha.get("clicks", 0) or 0
                ),
                "ctr": float(campanha.get("ctr", 0) or 0),
                "cpm": float(campanha.get("cpm", 0) or 0),
                "leads": campanha_leads,
                "cpl": campanha_cpl,
            }
        )

    return {
        "periodo_solicitado": periodo_solicitado,
        "periodo_utilizado": periodo_utilizado,
        "gasto": gasto,
        "impressoes": impressoes,
        "alcance": int(insights.get("reach", 0) or 0),
        "cliques": int(insights.get("clicks", 0) or 0),
        "ctr": float(insights.get("ctr", 0) or 0),
        "cpm": float(insights.get("cpm", 0) or 0),
        "cpl_bruto": cpl,
        "leads_meta": leads,
        "frequencia": float(
            insights.get("frequency", 0) or 0
        ),
        "hook_rate": hook_rate,
        "campanhas": campanhas_normalizadas,
    }