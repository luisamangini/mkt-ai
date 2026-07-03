# core/llm.py
from backend.config.settings import (
    LLM_PROVIDER,
    GROQ_API_KEY, GROQ_MODEL,
    ANTHROPIC_API_KEY, ANTHROPIC_MODEL,
)


def get_completion(
    system: str,
    user: str,
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> str:
    """
    Ponto único de chamada ao LLM.
    Trocar LLM_PROVIDER no .env migra todos os agentes sem tocar no código.

    Args:
        system:     system prompt do agente
        user:       mensagem do usuário / input do dia
        max_tokens: limite de tokens na resposta
        json_mode:  True força o modelo a retornar JSON válido (quando suportado)

    Returns:
        string com a resposta do modelo
    """
    if LLM_PROVIDER == "groq":
        return _groq_completion(system, user, max_tokens, json_mode)
    elif LLM_PROVIDER == "anthropic":
        return _anthropic_completion(system, user, max_tokens)
    else:
        raise ValueError(
            f"LLM_PROVIDER inválido: '{LLM_PROVIDER}'. "
            "Use 'groq' ou 'anthropic' no .env."
        )


# ─────────────────────────────────────────────
# Providers privados
# ─────────────────────────────────────────────

def _groq_completion(
    system: str,
    user: str,
    max_tokens: int,
    json_mode: bool,
) -> str:
    try:
        from groq import Groq
    except ImportError:
        raise ImportError("Instale o pacote groq: pip install groq")

    client = Groq(api_key=GROQ_API_KEY)

    kwargs = {
        "model": GROQ_MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }

    # json_mode força o modelo a retornar JSON válido
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content


def _anthropic_completion(
    system: str,
    user: str,
    max_tokens: int,
) -> str:
    """
    Nota: quando migrar para Anthropic, a busca web é adicionada
    aqui via tools=[{"type": "web_search_20250305", "name": "web_search"}]
    O research_agent.py tem instrução comentada para isso.
    """
    try:
        import anthropic
    except ImportError:
        raise ImportError("Instale o pacote anthropic: pip install anthropic")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    resp = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in resp.content if b.type == "text")# core/llm.py
from backend.config.settings import (
    LLM_PROVIDER,
    GROQ_API_KEY, GROQ_MODEL,
    ANTHROPIC_API_KEY, ANTHROPIC_MODEL,
)


def get_completion(
    system: str,
    user: str,
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> str:
    """
    Ponto único de chamada ao LLM.
    Trocar LLM_PROVIDER no .env migra todos os agentes sem tocar no código.

    Args:
        system:     system prompt do agente
        user:       mensagem do usuário / input do dia
        max_tokens: limite de tokens na resposta
        json_mode:  True força o modelo a retornar JSON válido (quando suportado)

    Returns:
        string com a resposta do modelo
    """
    if LLM_PROVIDER == "groq":
        return _groq_completion(system, user, max_tokens, json_mode)
    elif LLM_PROVIDER == "anthropic":
        return _anthropic_completion(system, user, max_tokens)
    else:
        raise ValueError(
            f"LLM_PROVIDER inválido: '{LLM_PROVIDER}'. "
            "Use 'groq' ou 'anthropic' no .env."
        )


# ─────────────────────────────────────────────
# Providers privados
# ─────────────────────────────────────────────

def _groq_completion(
    system: str,
    user: str,
    max_tokens: int,
    json_mode: bool,
) -> str:
    try:
        from groq import Groq
    except ImportError:
        raise ImportError("Instale o pacote groq: pip install groq")

    client = Groq(api_key=GROQ_API_KEY)

    kwargs = {
        "model": GROQ_MODEL,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }

    # json_mode força o modelo a retornar JSON válido
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content


def _anthropic_completion(
    system: str,
    user: str,
    max_tokens: int,
) -> str:
    """
    Nota: quando migrar para Anthropic, a busca web é adicionada
    aqui via tools=[{"type": "web_search_20250305", "name": "web_search"}]
    O research_agent.py tem instrução comentada para isso.
    """
    try:
        import anthropic
    except ImportError:
        raise ImportError("Instale o pacote anthropic: pip install anthropic")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    resp = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in resp.content if b.type == "text")