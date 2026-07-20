type FunnelStage = {
  label: string;
  value: number;
  percent: string;
  width: number;
  colorClass: string;
  textClass: string;
  conversionLabel?: string;
};

const funnelStages: FunnelStage[] = [
  {
    label: "Novo",
    value: 342,
    percent: "100.0%",
    width: 100,
    colorClass: "bg-[#2B7FFF]/20",
    textClass: "text-[#51A2FF]",
    conversionLabel: "26% conv.",
  },
  {
    label: "Qualificado",
    value: 89,
    percent: "26.0%",
    width: 26,
    colorClass: "bg-[#8E51FF]/20",
    textClass: "text-[#A684FF]",
    conversionLabel: "48% conv.",
  },
  {
    label: "Em Negociação",
    value: 43,
    percent: "12.6%",
    width: 12.6,
    colorClass: "bg-[#F59E0B]/20",
    textClass: "text-[#F59E0B]",
    conversionLabel: "28% conv.",
  },
  {
    label: "Fechado",
    value: 12,
    percent: "3.5%",
    width: 3.5,
    colorClass: "bg-[#05DF72]/20",
    textClass: "text-[#05DF72]",
  },
];

const lostStage: FunnelStage = {
  label: "Perdido",
  value: 198,
  percent: "57.9%",
  width: 57.9,
  colorClass: "bg-red-400/10",
  textClass: "text-red-400/80",
};

function FunnelBar({ stage }: { stage: FunnelStage }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white/5">
      <div
        className={`flex h-8 min-w-[112px] items-center justify-between rounded-lg px-3 ${stage.colorClass}`}
        style={{ width: `${stage.width}%` }}
      >
        <span
          className={`text-[10px] font-semibold leading-[15px] ${stage.textClass}`}
        >
          {stage.label}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold leading-[18px] text-[#0A0A0A]">
            {stage.value}
          </span>
          <span className="font-mono text-[9px] leading-[13.5px] text-[#717182]">
            {stage.percent}
          </span>
        </span>
      </div>
    </div>
  );
}

export function ConversionFunnel() {
  return (
    <section className="rounded-[10px] border border-black/10 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold leading-[18px] text-[#0A0A0A]">
          Funil de Conversão
        </h2>
        <span className="text-[10px] leading-[15px] text-[#717182]">
          30 dias
        </span>
      </div>

      <div className="space-y-2">
        {funnelStages.map((stage) => (
          <div key={stage.label}>
            <FunnelBar stage={stage} />
            {stage.conversionLabel ? (
              <div className="flex items-center gap-1 py-1 pl-2 text-[9px] leading-[13.5px] text-[#717182]/50">
                <span className="h-2.5 w-px bg-black/5" />
                <span>{stage.conversionLabel}</span>
              </div>
            ) : null}
          </div>
        ))}

        <div className="my-3 border-t border-black/10" />

        <FunnelBar stage={lostStage} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/10 pt-4 text-center">
        <div>
          <div className="text-xl font-semibold leading-6 text-[#0A0A0A]">
            3.5%
          </div>
          <div className="mt-1 text-[9px] leading-[13.5px] text-[#717182]">
            Taxa novo→fechado
          </div>
        </div>
        <div>
          <div className="text-xl font-semibold leading-6 text-[#0A0A0A]">
            132
          </div>
          <div className="mt-1 text-[9px] leading-[13.5px] text-[#717182]">
            Leads em aberto
          </div>
        </div>
      </div>
    </section>
  );
}
