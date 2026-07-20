import type { LeadStageCost } from "@/types/campaigns";
import { LeadStageCostRow } from "./LeadStageCostRow";

type LeadStageCostCardProps = {
  stages: LeadStageCost[];
};

export function LeadStageCostCard({ stages }: LeadStageCostCardProps) {
  const maxAmount = Math.max(...stages.map((stage) => stage.amount), 1);
  const minAmount = Math.min(...stages.map((stage) => stage.amount));

  return (
    <section className="rounded-[10px] border border-black/10 bg-white">
      <div className="border-b border-black/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#0A0A0A]">
          Custo por Estágio do Lead
        </h2>
        <p className="mt-1 text-[11px] text-[#717182]">
          Custo médio acumulado em cada avanço do funil
        </p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => (
          <LeadStageCostRow
            key={stage.badge}
            stage={stage}
            maxAmount={maxAmount}
            minAmount={minAmount}
          />
        ))}
      </div>
    </section>
  );
}
