import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.agents.qualification_agent import run
from backend.integrations.notifier import send_alert
from backend.models.enums import PrioridadeLead


def main():
    try:
        output = run()
    except Exception as e:
        print(f"\nAgente de Qualificação falhou: {e}")
        send_alert("Qualification Agent falhou", str(e))
        sys.exit(1)

    print(f"\n{'=' * 50}")
    print(f"QUALIFICAÇÃO CONCLUÍDA — {output.data}")
    print(f"{'=' * 50}")

    print(f"Leads analisados:   {output.total_leads_analisados}")
    print(f"Leads prioritários: {output.leads_prioritarios}")
    print(f"Leads frios:        {output.leads_frios}")

    print("\nRESUMO")
    print(output.resumo)

    prioritarios = [
        acao for acao in output.acoes
        if acao.prioridade == PrioridadeLead.ALTA
    ]

    outros = [
        acao for acao in output.acoes
        if acao.prioridade != PrioridadeLead.ALTA
    ]

    for acao in prioritarios + outros:
        marcador = {
            "alta": "[ALTA]",
            "media": "[MÉDIA]",
            "baixa": "[BAIXA]",
        }.get(acao.prioridade.value, "[SEM PRIORIDADE]")

        print(f"\n{marcador} {acao.lead_nome}")
        print(f"Ação: {acao.acao_sugerida}")
        print(f"Próximo passo: {acao.proximo_passo}")

        if acao.mensagem_reengajamento:
            print(f"Mensagem pronta:\n{acao.mensagem_reengajamento}")

        if acao.novo_status_sugerido:
            print(f"Status sugerido: {acao.novo_status_sugerido.value}")

    print("\nNenhuma ação foi executada automaticamente.")
    print("Operador revisa e age manualmente.")


if __name__ == "__main__":
    main()