type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  deltaContext?: string;
  positive: boolean;
};

export function MetricCard({
  label,
  value,
  delta,
  deltaContext,
  positive,
}: MetricCardProps) {
  return (
    <div className="flex min-h-[102px] flex-col items-start justify-start gap-1.5 rounded-[10px] border border-black/10 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase leading-[15px] tracking-[0.1em] text-[#717182]">
        {label}
      </div>

      <div className="text-2xl font-semibold leading-6 text-[#0A0A0A]">
        {value}
      </div>

      <div className="flex items-center gap-1 text-[11px] leading-[16.5px]">
        <span
          className={
            positive
              ? "font-medium text-[#05DF72]"
              : "font-medium text-[#717182]"
          }
        >
          {delta}
        </span>
        {deltaContext ? (
          <span className="font-normal text-[#717182]">{deltaContext}</span>
        ) : null}
      </div>
    </div>
  );
}
