import os
import sys

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    ),
)

import backend.agents.analysis_agent as analysis_agent
from backend.integrations.dashboard_builder import build_snapshot


def main() -> None:
    print("Construindo snapshot-base...")

    snapshot_real = build_snapshot()

    anuncios_simulados = snapshot_real.anuncios.model_copy(
        update={
            "gasto": 800.0,
            "leads_meta": 10,
            "cpl_bruto": 80.0,
        }
    )

    snapshot_simulado = snapshot_real.model_copy(
        update={
            "anuncios": anuncios_simulados,
        }
    )

    analysis_agent.build_snapshot = (
        lambda date_preset="last_7d": snapshot_simulado
    )

    analysis_agent.get_snapshots_anteriores = (
        lambda semana_atual, limite=4: []
    )

    analysis_agent.get_completion = lambda **kwargs: """
    {
      "situacao_geral": "CPL acima do limite configurado.",
      "destaque_positivo": "O sistema identificou corretamente os dados simulados.",
      "alerta": "CPL alto detectado.",
      "melhor_campanha": "Campanha de teste — CPL R$ 40,00",
      "pior_campanha": "Campanha de teste — CPL R$ 80,00",
      "recomendacoes": [
        "Revisar a campanha com maior CPL antes do próximo ciclo."
      ]
    }
    """

    print("\nExecutando Analysis Agent com CPL simulado...\n")

    output = analysis_agent.run()

    print("\nRESULTADO DO TESTE")
    print("=" * 50)
    print(f"CPL atual: R$ {output.cpl_atual:.2f}")
    print(f"Limite: R$ {output.cpl_limite:.2f}")
    print(
        "Alerta disparado: "
        f"{output.cpl_alerta_disparado}"
    )
    print("\nMensagem:")
    print(output.mensagem_alerta_cpl)

    assert output.cpl_atual == 80.0
    assert output.cpl_alerta_disparado is True
    assert output.mensagem_alerta_cpl

    print("\nTeste de disparo do alerta passou.")


if __name__ == "__main__":
    main()