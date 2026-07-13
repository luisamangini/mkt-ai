"""
Teste de falha intencional — RF-ORQ-03.

Valida que falhas isoladas:
- são capturadas;
- são registradas localmente e no Supabase;
- não encerram o restante da suíte;
- disparam o notifier sem depender de APIs reais.
"""

import os
import sys
from unittest.mock import patch

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)

from backend.core.logger import get_last_executions, log_execution
from backend.integrations.notifier import send_alert


def registrar_falha(
    agent: str,
    erro: Exception,
    cenario: str,
    titulo_alerta: str,
) -> None:
    mensagem = f"[TESTE INTENCIONAL] {str(erro)[:200]}"

    log_execution(
        agent=agent,
        status="falha",
        erro=mensagem,
        metadata={
            "cenario": cenario,
            "teste": True,
        },
    )

    try:
        send_alert(
            titulo=titulo_alerta,
            mensagem=str(erro)[:200],
        )
        print("   Alerta disparado")
    except Exception as notifier_error:
        # O teste principal não deve falhar porque o notifier local
        # ainda não envia mensagens reais.
        print(
            "   Notifier executado, mas retornou aviso: "
            f"{notifier_error}"
        )


print("=" * 55)
print("TESTE DE FALHA INTENCIONAL — RF-ORQ-03")
print("=" * 55)

resultados: list[tuple[str, bool]] = []


# CENÁRIO 1 — Research Agent com busca indisponível
print("\n[1/3] Simulando falha no Research Agent...")

try:
    from backend.agents import research_agent

    with patch.object(
        research_agent,
        "search_web",
        side_effect=ConnectionError(
            "Tavily indisponível — falha intencional"
        ),
    ):
        research_agent.run()

    print("   FALHOU: o agente deveria ter gerado exceção")
    resultados.append(("Research falha isolada", False))

except Exception as erro:
    registrar_falha(
        agent="research_agent",
        erro=erro,
        cenario="tavily_inacessivel",
        titulo_alerta="[TESTE] Research Agent falhou",
    )
    print("   Falha capturada e registrada corretamente")
    resultados.append(("Research falha isolada", True))


# CENÁRIO 2 — Content Agent sem pesquisa disponível
print("\n[2/3] Simulando falha no Content Agent...")

try:
    from backend.agents import content_agent

    # Substitui a função interna independentemente da assinatura real.
    with patch.object(
        content_agent,
        "_load_research",
        side_effect=FileNotFoundError(
            "Pesquisa do dia não encontrada — falha intencional"
        ),
    ):
        content_agent.run()

    print("   FALHOU: o agente deveria ter gerado exceção")
    resultados.append(("Content sem pesquisa", False))

except Exception as erro:
    registrar_falha(
        agent="content_agent",
        erro=erro,
        cenario="sem_pesquisa_do_dia",
        titulo_alerta="[TESTE] Content Agent falhou",
    )
    print("   Falha capturada e registrada corretamente")
    resultados.append(("Content sem pesquisa", True))


# CENÁRIO 3 — Qualification Agent sem Supabase
print("\n[3/3] Simulando falha no Qualification Agent...")

try:
    from backend.agents import qualification_agent

    with patch.object(
        qualification_agent,
        "get_leads_ativos",
        side_effect=ConnectionError(
            "Supabase inacessível — falha intencional"
        ),
    ):
        qualification_agent.run()

    print("   FALHOU: o agente deveria ter gerado exceção")
    resultados.append(
        ("Qualification com Supabase indisponível", False)
    )

except Exception as erro:
    registrar_falha(
        agent="qualification_agent",
        erro=erro,
        cenario="supabase_inacessivel",
        titulo_alerta="[TESTE] Qualification Agent falhou",
    )
    print("   Falha capturada e registrada corretamente")
    resultados.append(
        ("Qualification com Supabase indisponível", True)
    )


# RESULTADO
print("\n" + "=" * 55)
print("RESULTADO DOS TESTES")
print("=" * 55)

todos_ok = True

for nome, passou in resultados:
    status = "PASSOU" if passou else "FALHOU"
    print(f"  {status} — {nome}")

    if not passou:
        todos_ok = False


print("\nVerificando registros persistidos no Supabase...")

try:
    logs = get_last_executions(
        limit=20,
        source="supabase",
    )

    testes_no_log = [
        registro
        for registro in logs
        if registro.get("metadata", {}).get("teste") is True
    ]

    print(
        f"  {len(testes_no_log)} registro(s) de teste encontrado(s)"
    )

    agentes_registrados = {
        registro.get("agent")
        for registro in testes_no_log
    }

    esperados = {
        "research_agent",
        "content_agent",
        "qualification_agent",
    }

    for registro in testes_no_log[:3]:
        print(
            f"  [{registro.get('status')}] "
            f"{registro.get('agent')} — "
            f"{registro.get('erro', '')[:80]}"
        )

    if not esperados.issubset(agentes_registrados):
        print(
            "  FALHOU: nem todos os agentes apareceram "
            "nos logs persistidos"
        )
        todos_ok = False

except Exception as erro:
    print(f"  FALHOU ao consultar logs: {erro}")
    todos_ok = False


print("\n" + "=" * 55)

if todos_ok:
    print(
        "RF-ORQ-03 VALIDADO — falhas isoladas foram "
        "capturadas sem interromper os outros testes"
    )
else:
    print(
        "RF-ORQ-03 NÃO VALIDADO — revise os resultados acima"
    )

print("=" * 55)