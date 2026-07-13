# scripts/test_meta_campaigns.py
import os
import sys

import requests

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)

from backend.config.settings import (
    META_ACCESS_TOKEN,
    META_AD_ACCOUNT_ID,
)
BASE_URL = "https://graph.facebook.com/v25.0"


def validar_configuracao() -> None:
    if not META_ACCESS_TOKEN:
        raise ValueError(
            "META_ACCESS_TOKEN não está configurado no arquivo .env."
        )

    if not META_AD_ACCOUNT_ID:
        raise ValueError(
            "META_AD_ACCOUNT_ID não está configurado no arquivo .env."
        )


def get_meta(endpoint: str, params: dict | None = None) -> dict:
    parametros = dict(params or {})
    parametros["access_token"] = META_ACCESS_TOKEN

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


def main() -> None:
    validar_configuracao()

    print("=" * 50)
    print("Verificando Meta Ads")
    print("=" * 50)

    # 1. Conta de anúncios
    conta = get_meta(
        META_AD_ACCOUNT_ID,
        params={
            "fields": "name,account_status,currency,amount_spent",
        },
    )

    print(f"\nConta: {conta.get('name', 'Não informado')}")
    print(
        f"Status: {conta.get('account_status')} "
        "(1 = ativa, 2 = desativada)"
    )
    print(f"Moeda: {conta.get('currency', 'Não informada')}")
    print(f"Gasto total: {conta.get('amount_spent', '0')}")

    # 2. Campanhas
    campanhas = get_meta(
        f"{META_AD_ACCOUNT_ID}/campaigns",
        params={
            "fields": "id,name,status,objective",
            "limit": 10,
        },
    )

    lista_campanhas = campanhas.get("data", [])

    print(f"\nCampanhas encontradas: {len(lista_campanhas)}")

    for campanha in lista_campanhas:
        print(
            f"- [{campanha.get('status')}] "
            f"{campanha.get('name')} — "
            f"{campanha.get('objective')}"
        )

    # 3. Insights dos últimos 7 dias
    if lista_campanhas:
        print("\nInsights dos últimos 7 dias:")

        insights = get_meta(
            f"{META_AD_ACCOUNT_ID}/insights",
            params={
                "fields": (
                    "spend,impressions,reach,clicks,"
                    "ctr,cpm,actions"
                ),
                "date_preset": "last_7d",
                "level": "account",
            },
        )

        dados_insights = insights.get("data", [])

        if dados_insights:
            dados = dados_insights[0]

            print(f"Gasto: R$ {dados.get('spend', '0')}")
            print(f"Impressões: {dados.get('impressions', '0')}")
            print(f"Alcance: {dados.get('reach', '0')}")
            print(f"Cliques: {dados.get('clicks', '0')}")
            print(f"CTR: {dados.get('ctr', '0')}%")
            print(f"CPM: R$ {dados.get('cpm', '0')}")

            acoes = dados.get("actions", [])

            lead = next(
                (
                    acao
                    for acao in acoes
                    if acao.get("action_type") == "lead"
                ),
                None,
            )

            if lead:
                print(f"Leads: {lead.get('value', '0')}")
            else:
                print(
                    "Leads: 0 "
                    "(evento Lead não configurado ou sem resultados)"
                )
        else:
            print(
                "Sem dados de insights: "
                "a conta não teve gasto nos últimos 7 dias."
            )
    else:
        print("\nNenhuma campanha encontrada na conta.")
        print(
            "O Dashboard ainda não terá dados reais de campanhas."
        )


if __name__ == "__main__":
    main()