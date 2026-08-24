import type { DashboardMetric } from "@/types/dashboard";

type MetricCardProps = DashboardMetric;

export function MetricCard({
  label,
  value,
  delta,
  deltaContext,
  tone,
}: MetricCardProps) {
  return (
    <div className="flex min-h-[102px] flex-col items-start justify-start gap-1.5 rounded-[10px] border border-border bg-card p-4">
      <div className="text-[10px] font-semibold uppercase leading-[15px] tracking-[0.1em] text-muted-foreground">
        {label}
      </div>

      <div className="text-2xl font-semibold leading-6 text-foreground">
        {value}
      </div>

      <div className="flex items-center gap-1 text-[11px] leading-[16.5px]">
        <span
          className={
            tone === "positive"
              ? "font-medium text-[#05DF72]"
              : tone === "negative"
                ? "font-medium text-red-500"
                : "font-medium text-muted-foreground"
          }
        >
          {delta}
        </span>
        {deltaContext ? (
          <span className="font-normal text-muted-foreground">{deltaContext}</span>
        ) : null}
      </div>
    </div>
  );
}
