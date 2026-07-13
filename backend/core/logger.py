import json
import os
from datetime import datetime, timezone
from typing import Any

from backend.config.settings import ENV, LOG_FILE


def log_execution(
    agent: str,
    status: str,
    resultado: str | None = None,
    erro: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Registra cada execução em dois destinos:

    1. Arquivo JSONL local
    2. Supabase para persistência centralizada

    Uma falha no Supabase não interrompe a execução do agente.
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "status": status,
        "resultado": resultado or "",
        "erro": erro or "",
        "metadata": metadata or {},
        "ambiente": ENV,
    }

    _salvar_local(entry)

    try:
        _salvar_supabase(entry)
    except Exception as exc:
        print(
            "[logger] Aviso: falha ao salvar log no Supabase: "
            f"{exc}"
        )


def _salvar_local(entry: dict[str, Any]) -> None:
    """Salva o registro localmente em JSONL UTF-8."""
    diretorio = os.path.dirname(LOG_FILE)

    if diretorio:
        os.makedirs(diretorio, exist_ok=True)

    with open(
        LOG_FILE,
        "a",
        encoding="utf-8",
    ) as arquivo:
        arquivo.write(
            json.dumps(
                entry,
                ensure_ascii=False,
                default=str,
            )
            + "\n"
        )


def _salvar_supabase(entry: dict[str, Any]) -> None:
    """Persiste o registro no Supabase."""
    from backend.integrations.supabase import get_client

    client = get_client()

    client.table("execucoes").insert(
        {
            "timestamp": entry["timestamp"],
            "agent": entry["agent"],
            "status": entry["status"],
            "resultado": entry["resultado"],
            "erro": entry["erro"],
            "metadata": entry["metadata"],
            "ambiente": entry["ambiente"],
        }
    ).execute()


def get_last_executions(
    agent: str | None = None,
    limit: int = 20,
    source: str = "supabase",
) -> list[dict]:
    """
    Retorna as últimas execuções.

    source:
    - supabase
    - local
    """
    if source == "supabase":
        return _get_from_supabase(agent, limit)

    if source == "local":
        return _get_from_local(agent, limit)

    raise ValueError(
        "source deve ser 'supabase' ou 'local'"
    )


def _get_from_supabase(
    agent: str | None,
    limit: int,
) -> list[dict]:
    from backend.integrations.supabase import get_client

    client = get_client()

    query = (
        client.table("execucoes")
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit)
    )

    if agent:
        query = query.eq("agent", agent)

    response = query.execute()
    return response.data or []


def _get_from_local(
    agent: str | None,
    limit: int,
) -> list[dict]:
    if not os.path.exists(LOG_FILE):
        return []

    entries: list[dict] = []

    with open(
        LOG_FILE,
        "r",
        encoding="utf-8",
    ) as arquivo:
        linhas = arquivo.readlines()

    for linha in reversed(linhas):
        try:
            entry = json.loads(linha.strip())
        except json.JSONDecodeError:
            continue

        if agent is not None and entry.get("agent") != agent:
            continue

        entries.append(entry)

        if len(entries) >= limit:
            break

    return entries