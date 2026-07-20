import type { FunnelStage } from "@/types/campaigns";

type ConversionFunnelProps = {
  stages: FunnelStage[];
};

const barColors: Record<FunnelStage["color"], string> = {
  blue: "bg-[#51A2FF]",
  purple: "bg-[#6366F1]",
  orange: "bg-[#F59E0B]",
  green: "bg-[#22C55E]",
  red: "bg-red-300",
};

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  return (
    <section className="h-full rounded-[10px] border border-black/10 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0A0A0A]">
            Funil de Conversão
          </h2>
          <p className="mt-1 text-[11px] text-[#717182]">
            Avanço dos leads captados
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-[#717182]">
          30 dias
        </span>
      </div>

      <div className="space-y-3 p-4">
        {stages.map((stage) => {
          const width = `${Math.max(stage.percentage, 7)}%`;

          return (
            <div
              key={stage.name}
              className={stage.separated ? "border-t border-black/10 pt-3" : ""}
            >
              {stage.previousConversion ? (
                <div className="mb-1.5 text-[10px] font-medium text-[#717182]">
                  {stage.previousConversion}
                </div>
              ) : null}
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#0A0A0A]">
                  {stage.name}
                </span>
                <span className="text-[11px] text-[#717182]">
                  <strong className="font-semibold text-[#0A0A0A]">
                  {stage.quantity}
                  </strong>{" "}
                  {stage.percentage.toLocaleString("pt-BR", {
                    minimumFractionDigits: stage.percentage % 1 === 0 ? 0 : 1,
                    maximumFractionDigits: 1,
                  })}
                  %
                </span>
              </div>
              <div className="h-6 overflow-hidden rounded-md bg-gray-100">
                <div
                  className={`flex h-full items-center rounded-md px-2 text-[10px] font-medium text-white ${
                    stage.separated ? "opacity-70" : ""
                  } ${barColors[stage.color]}`}
                  style={{ width }}
                >
                  {stage.percentage.toLocaleString("pt-BR", {
                    minimumFractionDigits: stage.percentage % 1 === 0 ? 0 : 1,
                    maximumFractionDigits: 1,
                  })}
                  %
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
