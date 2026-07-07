# backend/orchestrator/run_content.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.agents.content_agent import run
from backend.integrations.notifier import send_alert


def main():
    print("=" * 50)
    print("Agente de Conteúdo — iniciando")
    print("=" * 50)

    try:
        output = run()
    except FileNotFoundError as e:
        print(f"\n{e}")
        send_alert(" Content Agent — pesquisa ausente", str(e))
        sys.exit(1)
    except Exception as e:
        print(f"\nFalhou: {e}")
        send_alert(" Content Agent falhou", str(e))
        sys.exit(1)

    print(f"\n{'=' * 50}")
    print(f" {output.total_roteiros} ROTEIROS GERADOS — {output.data}")
    print(f"{'=' * 50}")

    for i, roteiro in enumerate(output.roteiros, 1):
        print(f"\n── ROTEIRO {i}/{output.total_roteiros} ──────────────────────────")
        print(f"Título:     {roteiro.titulo_interno}")
        print(f"Pilar:      {roteiro.pilar.value}")
        print(f"Formato:    {roteiro.formato.value.upper()}")
        print(f"Compliance: {'✓ OK' if roteiro.compliance_checou else ' REVISAR'}")
        print(f"\nHOOK: {roteiro.roteiro.hook}")
        print(f"\nDESENVOLVIMENTO:")
        for linha in roteiro.roteiro.desenvolvimento:
            print(f"  • {linha}")
        if roteiro.roteiro.slides:
            print(f"\nSLIDES:")
            for slide in roteiro.roteiro.slides:
                print(f"  [{slide.ordem}] {slide.texto[:80]}")
        print(f"\nCTA: {roteiro.roteiro.cta}")
        print(f"\nHASHTAGS: {' '.join(f'#{h.lstrip(chr(35)).strip()}' for h in roteiro.hashtags)}")

    print(f"\n Todos aguardam revisão humana antes de publicar.")


if __name__ == "__main__":
    main()