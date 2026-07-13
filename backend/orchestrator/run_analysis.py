import os
import sys

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", ".."),
)

from backend.agents.analysis_agent import run
from backend.integrations.notifier import send_alert


def main() -> None:
    try:
        output = run()
    except Exception as exc:
        print(
            f"\nAgente de Análise falhou: {exc}"
        )

        try:
            send_alert(
                "Analysis Agent falhou",
                str(exc),
            )
        except Exception as notifier_error:
            print(
                "Também houve erro ao enviar o alerta: "
                f"{notifier_error}"
            )

        sys.exit(1)

    print(f"\n{'=' * 50}")
    print(
        f"ANÁLISE CONCLUÍDA — {output.semana}"
    )
    print(f"{'=' * 50}")

    print("\nSITUAÇÃO GERAL")
    print(output.situacao_geral)

    print("\nDESTAQUE POSITIVO")
    print(output.destaque_positivo)

    if output.alerta:
        print("\nALERTA")
        print(output.alerta)

    print("\nCAMPANHAS")
    print(
        f"Melhor: {output.melhor_campanha}"
    )
    print(
        f"Pior: {output.pior_campanha}"
    )

    print("\nRECOMENDAÇÕES")

    for indice, recomendacao in enumerate(
        output.recomendacoes,
        start=1,
    ):
        print(
            f"{indice}. {recomendacao}"
        )

    print(
        "\nA análise foi gerada, mas nenhuma ação "
        "foi executada automaticamente."
    )


if __name__ == "__main__":
    main()