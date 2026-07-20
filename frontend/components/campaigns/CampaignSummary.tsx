import type { CampaignMetric, CampaignStatusSummary } from "@/types/campaigns";
import { CampaignMetricCard } from "./CampaignMetricCard";
import { CampaignStatusStrip } from "./CampaignStatusStrip";

type CampaignSummaryProps = {
  metrics: CampaignMetric[];
  statusItems: CampaignStatusSummary[];
};

export function CampaignSummary({ metrics, statusItems }: CampaignSummaryProps) {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <CampaignMetricCard key={metric.label} metric={metric} />
        ))}
      </div>
      <CampaignStatusStrip items={statusItems} />
    </section>
  );
}
