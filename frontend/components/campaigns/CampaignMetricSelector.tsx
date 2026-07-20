import type { CampaignChartMetric } from "@/types/campaigns";

type CampaignMetricSelectorProps = {
  selectedMetric: CampaignChartMetric;
  onMetricChange: (metric: CampaignChartMetric) => void;
};

const metricOptions: Array<{ label: string; value: CampaignChartMetric }> = [
  { label: "Investimento × Leads", value: "investment_leads" },
  { label: "CPL", value: "cpl" },
  { label: "CTR", value: "ctr" },
];

export function CampaignMetricSelector({
  selectedMetric,
  onMetricChange,
}: CampaignMetricSelectorProps) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-md border border-black/10 bg-white p-0.5">
      {metricOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onMetricChange(option.value)}
          className={`h-8 shrink-0 rounded px-3 text-[11px] font-medium transition-colors ${
            selectedMetric === option.value
              ? "bg-gray-100 text-[#0A0A0A]"
              : "text-[#717182] hover:text-[#0A0A0A]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
