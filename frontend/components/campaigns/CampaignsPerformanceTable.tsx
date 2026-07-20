import type { CampaignPerformanceRow, CampaignStatus } from "@/types/campaigns";

type CampaignsPerformanceTableProps = {
  rows: CampaignPerformanceRow[];
};

const statusClasses: Record<CampaignStatus, string> = {
  ativa: "border-green-200 bg-green-50 text-green-700",
  pausada: "border-amber-200 bg-amber-50 text-amber-700",
  encerrada: "border-gray-200 bg-gray-50 text-[#717182]",
};

const statusLabels: Record<CampaignStatus, string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

export function CampaignsPerformanceTable({
  rows,
}: CampaignsPerformanceTableProps) {
  return (
    <section className="rounded-[10px] border border-black/10 bg-white">
      <div className="border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#0A0A0A]">
          Desempenho por campanha
        </h2>
        <p className="mt-1 text-[11px] text-[#717182]">
          Visão consolidada das principais campanhas no período
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-black/10 bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-[#717182]">
              <th className="px-4 py-3">Campanha</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Investimento</th>
              <th className="px-3 py-3 text-right">Impressões</th>
              <th className="px-3 py-3 text-right">Cliques</th>
              <th className="px-3 py-3 text-right">CTR</th>
              <th className="px-3 py-3 text-right">Leads</th>
              <th className="px-3 py-3 text-right">CPL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.campaign}
                className="border-b border-black/5 text-[11px] text-[#717182] hover:bg-gray-50/70"
              >
                <td className="px-4 py-4 text-xs font-medium text-[#0A0A0A]">
                  {row.campaign}
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses[row.status]}`}
                  >
                    {statusLabels[row.status]}
                  </span>
                </td>
                <td className="px-3 py-4 text-right tabular-nums">{row.investment}</td>
                <td className="px-3 py-4 text-right tabular-nums">{row.impressions}</td>
                <td className="px-3 py-4 text-right tabular-nums">{row.clicks}</td>
                <td className="px-3 py-4 text-right tabular-nums">{row.ctr}</td>
                <td className="px-3 py-4 text-right font-semibold tabular-nums text-[#0A0A0A]">
                  {row.leads}
                </td>
                <td className="px-3 py-4 text-right tabular-nums">{row.cpl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
