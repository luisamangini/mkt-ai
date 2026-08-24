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
  const safeMin = Math.max(minAmount, 0.01);
  const safeMax = Math.max(maxAmount, safeMin);
  const minLog = Math.log10(safeMin);
  const maxLog = Math.log10(safeMax);
  const amountLog = Math.log10(Math.max(stage.amount, 0.01));
  const normalized =
    maxLog === minLog ? 1 : (amountLog - minLog) / (maxLog - minLog);
  const width = stage.amount === 0 ? "0%" : `${Math.max(18 + normalized * 82, 18)}%`;

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground">
            {stage.name}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {stage.description}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-foreground">
            {stage.value}
          </div>
          <div className="mt-1 inline-flex rounded border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {stage.badge}
          </div>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[#2563EB]" style={{ width }} />
      </div>
    </div>
  );
}
