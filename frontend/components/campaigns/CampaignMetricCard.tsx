import type { CampaignMetric } from "@/types/campaigns";

type CampaignMetricCardProps = {
  metric: CampaignMetric;
};

export function CampaignMetricCard({ metric }: CampaignMetricCardProps) {
  return (
    <div className="flex min-h-[102px] flex-col items-start justify-start gap-1.5 rounded-[10px] border border-black/10 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase leading-[15px] tracking-[0.1em] text-[#717182]">
        {metric.label}
      </div>
      <div className="text-2xl font-semibold leading-6 text-[#0A0A0A]">
        {metric.value}
      </div>
      <div className="flex items-center gap-1 text-[11px] leading-[16.5px]">
        <span
          className={
            metric.isPositive
              ? "font-medium text-[#16A34A]"
              : "font-medium text-red-500"
          }
        >
          {metric.variation}
        </span>
        <span className="font-normal text-[#717182]">
          {metric.variationLabel}
        </span>
      </div>
    </div>
  );
}
