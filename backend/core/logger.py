# core/logger.py
import json
import os
from datetime import datetime, timezone
from backend.config.settings import LOG_FILE


def log_execution(
    agent: str,
    status: str,
    resultado: str = "",
    erro: str = "",
    metadata: dict | None = None,
) -> None:
    """
    Registra cada execução em JSONL — uma linha por execução.
    Consultável pelo operador e pelo n8n.

    Args:
        agent:     nome do agente (ex: "research_agent")
        status:    "ok" | "falha"
        resultado: resumo do que foi produzido
        erro:      mensagem de erro se status == "falha"
        metadata:  dados extras opcionais (tokens usados, etc.)
    """
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "status": status,
        "resultado": resultado,
        "erro": erro,
        "metadata": metadata or {},
    }

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def get_last_executions(agent: str | None = None, limit: int = 20) -> list[dict]:
    """
    Lê as últimas execuções do log.
    Útil para debug e para o n8n consultar o histórico.
    """
    if not os.path.exists(LOG_FILE):
        return []

    with open(LOG_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    entries = []
    for line in reversed(lines):
        try:
            entry = json.loads(line.strip())
            if agent is None or entry.get("agent") == agent:
                entries.append(entry)
            if len(entries) >= limit:
                break
        except json.JSONDecodeError:
            continue

    return entries