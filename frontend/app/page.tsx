import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import { FollowersReachCard } from "@/components/dashboard/FollowersReachCard";
import { LeadCostChart } from "@/components/dashboard/LeadCostChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PostsTable } from "@/components/dashboard/PostsTable";

type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  deltaContext?: string;
  positive: boolean;
};

const metrics: DashboardMetric[] = [
  {
    label: "Leads (30d)",
    value: "342",
    delta: "+18%",
    deltaContext: "vs mês ant.",
    positive: true,
  },
  {
    label: "Qualificados",
    value: "89",
    delta: "+22%",
    deltaContext: "vs mês ant.",
    positive: true,
  },
  {
    label: "Fechados",
    value: "12",
    delta: "+4",
    deltaContext: "vs mês ant.",
    positive: true,
  },
  {
    label: "CPM Médio",
    value: "R$ 41.2k",
    delta: "+R$ 8.4k",
    positive: true,
  },
  {
    label: "CPL Médio",
    value: "R$ 28,40",
    delta: "-R$ 4,20",
    positive: true,
  },
  {
    label: "CTR Médio",
    value: "3.8×",
    delta: "+0.4×",
    positive: true,
  },
];

export default function Home() {
  return (
    <div className="min-w-0 space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            deltaContext={metric.deltaContext}
            positive={metric.positive}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">
        <PostsTable />
        <FollowersReachCard />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">
        <LeadCostChart />
        <ConversionFunnel />
      </section>
    </div>
  );
}
