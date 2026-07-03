from backend.config.settings import SEARCH_PROVIDER, TAVILY_API_KEY


def search_web(query: str, max_results: int = 5) -> list[dict]:
    """
    Busca web centralizada do projeto.
    Hoje usa Tavily. Futuramente pode trocar para Anthropic Web Search.
    """
    if SEARCH_PROVIDER == "tavily":
        return _tavily_search(query, max_results)

    raise ValueError(f"SEARCH_PROVIDER inválido: {SEARCH_PROVIDER}")


def _tavily_search(query: str, max_results: int) -> list[dict]:
    if not TAVILY_API_KEY:
        raise ValueError("TAVILY_API_KEY não encontrada no .env")

    try:
        from tavily import TavilyClient
    except ImportError:
        raise ImportError("Instale com: python -m pip install tavily-python")

    client = TavilyClient(api_key=TAVILY_API_KEY)

    response = client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
        include_answer=False,
    )

    results = response.get("results", [])

    return [
        {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": item.get("content", ""),
            "score": item.get("score", None),
        }
        for item in results
    ]