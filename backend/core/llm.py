from backend.config.settings import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    LLM_PROVIDER,
)


def get_completion(
    system: str,
    user: str,
    max_tokens: int = 1024,
    json_mode: bool = False,
    use_web_search: bool = False,
    max_searches: int = 3,
) -> str:
    """
    Ponto único de chamada ao LLM.

    Args:
        system: prompt de sistema
        user: mensagem de entrada
        max_tokens: limite de saída
        json_mode: solicita saída JSON
        use_web_search: ativa busca web nativa da Anthropic
        max_searches: limite máximo de buscas web por chamada
    """
    if LLM_PROVIDER == "groq":
        if use_web_search:
            raise ValueError(
                "A busca web nativa só está disponível "
                "com LLM_PROVIDER=anthropic."
            )

        return _groq_completion(
            system=system,
            user=user,
            max_tokens=max_tokens,
            json_mode=json_mode,
        )

    if LLM_PROVIDER == "anthropic":
        return _anthropic_completion(
            system=system,
            user=user,
            max_tokens=max_tokens,
            json_mode=json_mode,
            use_web_search=use_web_search,
            max_searches=max_searches,
        )

    raise ValueError(
        f"LLM_PROVIDER inválido: '{LLM_PROVIDER}'. "
        "Use 'groq' ou 'anthropic' no .env."
    )

def _groq_completion(
    system: str,
    user: str,
    max_tokens: int,
    json_mode: bool,
) -> str:
    try:
        from groq import Groq
    except ImportError as exc:
        raise ImportError(
            "Instale o pacote Groq com: "
            "python -m pip install groq"
        ) from exc

    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY não está configurada."
        )

    client = Groq(
        api_key=GROQ_API_KEY
    )

    kwargs = {
        "model": GROQ_MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "system",
                "content": system,
            },
            {
                "role": "user",
                "content": user,
            },
        ],
    }

    if json_mode:
        kwargs["response_format"] = {
            "type": "json_object"
        }

    resposta = client.chat.completions.create(
        **kwargs
    )

    conteudo = resposta.choices[0].message.content

    if not conteudo:
        raise RuntimeError(
            "A Groq retornou uma resposta vazia."
        )

    return conteudo


def _anthropic_completion(
    system: str,
    user: str,
    max_tokens: int,
    json_mode: bool,
    use_web_search: bool,
    max_searches: int,
) -> str:
    try:
        import anthropic
    except ImportError as exc:
        raise ImportError(
            "Instale o pacote Anthropic com: "
            "python -m pip install anthropic"
        ) from exc

    if not ANTHROPIC_API_KEY:
        raise ValueError(
            "ANTHROPIC_API_KEY não está configurada."
        )

    system_final = system

    if json_mode:
        system_final = (
            f"{system}\n\n"
            "IMPORTANTE: responda somente com JSON válido. "
            "Não use markdown, blocos de código ou texto "
            "fora do objeto JSON."
        )

    tools = []

    if use_web_search:
        tools = [
            {
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": max_searches,
            }
        ]

    client = anthropic.Anthropic(
        api_key=ANTHROPIC_API_KEY
    )

    messages = [
        {
            "role": "user",
            "content": user,
        }
    ]

    resposta = None

    for _ in range(3):
        resposta = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system_final,
            messages=messages,
            tools=tools,
        )

        if resposta.stop_reason != "pause_turn":
            break

        messages = [
            {
                "role": "user",
                "content": user,
            },
            {
                "role": "assistant",
                "content": resposta.content,
            },
        ]

    if resposta is None:
        raise RuntimeError(
            "A Anthropic não retornou resposta."
        )

    if resposta.stop_reason == "max_tokens":
        raise RuntimeError(
            "A resposta da Anthropic foi cortada por limite "
            "de tokens. Aumente max_tokens."
        )

    texto = "".join(
        bloco.text
        for bloco in resposta.content
        if bloco.type == "text"
    ).strip()

    if not texto:
        tipos_blocos = [
            bloco.type
            for bloco in resposta.content
        ]

        raise RuntimeError(
            "A Anthropic não retornou texto final. "
            f"stop_reason={resposta.stop_reason}; "
            f"blocos={tipos_blocos}"
        )

    return texto