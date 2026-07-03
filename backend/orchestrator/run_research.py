import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.agents.research_agent import run
from backend.integrations.notifier import send_alert


def main():

    print("=" * 60)
    print("AGENTE DE PESQUISA")
    print("=" * 60)

    output = run()

    if output.status.value == "falha":

        send_alert(
            titulo="Agente de Pesquisa falhou",
            mensagem=output.erro or "Erro desconhecido",
        )

        sys.exit(1)

    print("\nPesquisa concluída!\n")

    for i, tema in enumerate(output.temas, start=1):

        print(f"{i}. {tema.titulo}")
        print(f"   Relevância: {tema.relevancia.value}")
        print(f"   Pilar: {tema.pilar_sugerido.value}")
        print(f"   Ângulo: {tema.angulo_sugerido}\n")

    print("JSON disponível para o próximo agente.")


if __name__ == "__main__":
    main()