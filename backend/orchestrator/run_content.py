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
        print(f"\n❌ {e}")
        send_alert("⚠️ Content Agent — pesquisa ausente", str(e))
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Falhou: {e}")
        send_alert("⚠️ Content Agent falhou", str(e))
        sys.exit(1)

    print(f"\n{'=' * 50}")
    print(f"✅ ROTEIRO GERADO")
    print(f"{'=' * 50}")
    print(f"Título:     {output.titulo_interno}")
    print(f"Pilar:      {output.pilar.value}")
    print(f"Formato:    {output.formato.value.upper()}")
    print(f"Compliance: {'✓ OK' if output.compliance_checou else '⚠️  REVISAR'}")
    print(f"Status:     {output.revisao_humana.value.upper()}")

    print(f"\n── HOOK ──────────────────────────────────")
    print(f"{output.roteiro.hook}")

    print(f"\n── DESENVOLVIMENTO ───────────────────────")
    for linha in output.roteiro.desenvolvimento:
        print(f"  • {linha}")

    if output.roteiro.slides:
        print(f"\n── SLIDES ({len(output.roteiro.slides)}) ──────────────────────")
        for slide in output.roteiro.slides:
            print(f"  [{slide.ordem}] {slide.texto[:80]}")

    print(f"\n── CTA ───────────────────────────────────")
    print(f"{output.roteiro.cta}")

    print(f"\n── HASHTAGS ──────────────────────────────")
    print(" ".join(f"#{h.lstrip('#')}" for h in output.hashtags))

    print(f"\n⚑  Aguarda revisão humana antes de publicar.")
    print(f"   Arquivo: data/content_{output.data}.json")


if __name__ == "__main__":
    main()