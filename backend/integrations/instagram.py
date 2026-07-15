import requests

from backend.config.settings import META_ACCESS_TOKEN


BASE_URL = "https://graph.facebook.com/v25.0"


def _get(
    endpoint: str,
    params: dict | None = None,
) -> dict:
    parametros = {
        "access_token": META_ACCESS_TOKEN,
    }

    if params:
        parametros.update(params)

    resposta = requests.get(
        f"{BASE_URL}/{endpoint.lstrip('/')}",
        params=parametros,
        timeout=30,
    )

    dados = resposta.json()

    if "error" in dados:
        mensagem = dados["error"].get(
            "message",
            "Erro desconhecido na Instagram Graph API",
        )
        raise RuntimeError(mensagem)

    return dados


def get_instagram_account_id() -> str:
    """
    Localiza a conta profissional do Instagram
    vinculada a uma Página acessível pelo token.
    """
    dados = _get(
        "me/accounts",
        {
            "fields": (
                "id,name,instagram_business_account"
            ),
        },
    )

    for pagina in dados.get("data", []):
        conta_instagram = pagina.get(
            "instagram_business_account"
        )

        if conta_instagram and conta_instagram.get("id"):
            return conta_instagram["id"]

    raise RuntimeError(
        "Nenhuma conta profissional do Instagram "
        "foi encontrada para o token atual."
    )


def get_instagram_metricas() -> dict:
    """
    Busca dados básicos e métricas orgânicas
    da conta profissional do Instagram.
    """
    account_id = get_instagram_account_id()

    dados_conta = _get(
        account_id,
        {
            "fields": (
                "username,followers_count,media_count"
            ),
        },
    )

    alcance_raw = _get(
        f"{account_id}/insights",
        {
            "metric": "reach",
            "period": "week",
        },
    )

    totais_raw = _get(
        f"{account_id}/insights",
        {
            "metric": "views,profile_views",
            "period": "day",
            "metric_type": "total_value",
        },
    )

    alcance = 0

    for metrica in alcance_raw.get("data", []):
        if metrica.get("name") != "reach":
            continue

        valores = metrica.get("values", [])

        if valores:
            alcance = int(
                valores[-1].get("value", 0) or 0
            )

    totais = {
        metrica.get("name"): int(
            metrica
            .get("total_value", {})
            .get("value", 0)
            or 0
        )
        for metrica in totais_raw.get("data", [])
    }

    return {
        "username": dados_conta.get("username", ""),
        "seguidores": int(
            dados_conta.get("followers_count", 0) or 0
        ),
        "total_posts": int(
            dados_conta.get("media_count", 0) or 0
        ),
        "alcance": alcance,
        "visualizacoes": totais.get("views", 0),
        "visitas_perfil": totais.get(
            "profile_views",
            0,
        ),
    }