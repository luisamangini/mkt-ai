import os
import sys
import traceback

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    ),
)

from backend.integrations.dashboard_builder import (
    build_snapshot,
)


def main() -> None:
    print("Construindo Dashboard Snapshot...\n")

    try:
        snapshot = build_snapshot()

        print(f"Snapshot gerado: {snapshot.semana}")

        if snapshot.aviso:
            print(f"Aviso: {snapshot.aviso}")

        print("\nMETA ADS")
        print(
            "Período solicitado: "
            f"{snapshot.anuncios.periodo_solicitado}"
        )
        print(
            "Período utilizado:  "
            f"{snapshot.anuncios.periodo_utilizado}"
        )
        print(
            f"Gasto: R$ {snapshot.anuncios.gasto:.2f}"
        )
        print(
            f"Impressões: {snapshot.anuncios.impressoes:,}"
        )
        print(
            f"Alcance: {snapshot.anuncios.alcance:,}"
        )
        print(
            f"Cliques: {snapshot.anuncios.cliques:,}"
        )
        print(
            f"Leads: {snapshot.anuncios.leads_meta}"
        )
        print(
            "CPL bruto: R$ "
            f"{snapshot.anuncios.cpl_bruto:.2f}"
        )
        print(
            f"CTR: {snapshot.anuncios.ctr:.2f}%"
        )
        print(
            f"CPM: R$ {snapshot.anuncios.cpm:.2f}"
        )
        print(
            f"Frequência: {snapshot.anuncios.frequencia:.2f}"
        )
        print(
            f"Hook rate: {snapshot.anuncios.hook_rate:.1f}%"
        )
        print(
            "Campanhas: "
            f"{len(snapshot.anuncios.campanhas)}"
        )

        for campanha in snapshot.anuncios.campanhas[:5]:
            print(
                f"- {campanha.nome[:45]} | "
                f"Gasto: R$ {campanha.gasto:.2f} | "
                f"Leads: {campanha.leads} | "
                f"CPL: R$ {campanha.cpl:.2f}"
            )

        print("\nCRM")
        print(
            f"Período: {snapshot.crm.periodo}"
        )
        print(
            f"Novos: {snapshot.crm.leads_novos}"
        )
        print(
            "Qualificados: "
            f"{snapshot.crm.leads_qualificados}"
        )
        print(
            "Em negociação: "
            f"{snapshot.crm.leads_em_negociacao}"
        )
        print(
            f"Fechados: {snapshot.crm.leads_fechados}"
        )
        print(
            f"Perdidos: {snapshot.crm.leads_perdidos}"
        )
        print(
            "Taxa de qualificação: "
            f"{snapshot.crm.taxa_qualificacao:.0%}"
        )
        print(
            "Taxa de fechamento: "
            f"{snapshot.crm.taxa_fechamento:.0%}"
        )
        print(
            "Custo por lead qualificado: "
            f"R$ {snapshot.crm.custo_lead_qualificado:.2f}"
        )
        print(
            "Custo por lead fechado: "
            f"R$ {snapshot.crm.custo_lead_fechado:.2f}"
        )

        print("\nINSTAGRAM")

        if snapshot.instagram:
            print(
                f"Username: @{snapshot.instagram.username}"
            )
            print(
                f"Seguidores: {snapshot.instagram.seguidores:,}"
            )
            print(
                f"Posts: {snapshot.instagram.total_posts}"
            )
            print(
                f"Alcance: {snapshot.instagram.alcance}"
            )
            print(
                "Visualizações: "
                f"{snapshot.instagram.visualizacoes}"
            )
            print(
                "Visitas ao perfil: "
                f"{snapshot.instagram.visitas_perfil}"
            )
        else:
            print("Sem dados do Instagram.")

    except Exception as exc:
        print(f"Falhou: {exc}")
        traceback.print_exc()


if __name__ == "__main__":
    main()