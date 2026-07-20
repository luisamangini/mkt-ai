import type { LeadStageCost } from "@/types/campaigns";

type LeadStageCostRowProps = {
  stage: LeadStageCost;
  maxAmount: number;
  minAmount: number;
};

export function LeadStageCostRow({
  stage,
  maxAmount,
  minAmount,
}: LeadStageCostRowProps) {
  const minLog = Math.log10(minAmount);
  const maxLog = Math.log10(maxAmount);
  const amountLog = Math.log10(stage.amount);
  const normalized =
    maxLog === minLog ? 1 : (amountLog - minLog) / (maxLog - minLog);
  const width = `${Math.max(18 + normalized * 82, 18)}%`;

  return (
    <div className="space-y-2 rounded-lg border border-black/5 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#0A0A0A]">
            {stage.name}
          </div>
          <div className="mt-0.5 text-[11px] text-[#717182]">
            {stage.description}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-[#0A0A0A]">
            {stage.value}
          </div>
          <div className="mt-1 inline-flex rounded border border-black/10 px-1.5 py-0.5 text-[9px] font-medium text-[#717182]">
            {stage.badge}
          </div>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#2563EB]" style={{ width }} />
      </div>
    </div>
  );
}
