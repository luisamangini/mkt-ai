type LeadCostItem = {
  title: string;
  description: string;
  value: string;
  badge: string;
  ratio: number;
  colorClass: string;
  valueClass: string;
  badgeClass: string;
  note?: string;
};

const maxCost = 496;

const leadCosts: LeadCostItem[] = [
  {
    title: "Custo por Lead",
    description: "Todo contato captado nas campanhas",
    value: "R$ 28,40",
    badge: "CPL",
    ratio: 28.4 / maxCost,
    colorClass: "bg-[#22C55E]",
    valueClass: "text-[#22C55E]",
    badgeClass: "bg-[#22C55E]/15 text-[#22C55E]",
  },
  {
    title: "Custo por Lead Qualificado",
    description: "Passou pelo roteiro de qualificação da IA",
    value: "R$ 104",
    badge: "CPLQ",
    ratio: 104 / maxCost,
    colorClass: "bg-[#F59E0B]",
    valueClass: "text-[#F59E0B]",
    badgeClass: "bg-[#F59E0B]/15 text-[#F59E0B]",
    note: "3.7× mais caro para qualificar",
  },
  {
    title: "Custo por Lead Fechado",
    description: "Cliente real — receita confirmada",
    value: "R$ 496",
    badge: "CPLF",
    ratio: 496 / maxCost,
    colorClass: "bg-[#6366F1]",
    valueClass: "text-[#6366F1]",
    badgeClass: "bg-[#6366F1]/15 text-[#6366F1]",
    note: "4.8× mais caro para fechar",
  },
];

const scale = ["R$ 0", "R$ 125", "R$ 250", "R$ 375", "R$ 496"];

export function LeadCostChart() {
  return (
    <section className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
      <div className="border-b border-black/10 px-5 py-3">
        <h2 className="text-xs font-semibold leading-[18px] text-[#0A0A0A]">
          Custo por Estágio do Lead
        </h2>
      </div>

      <div className="space-y-7 px-5 py-5">
        {leadCosts.map((item) => (
          <div key={item.badge} className="space-y-1.5">
            {item.note ? (
              <div className="ml-0 flex items-center gap-2 text-[10px] font-mono leading-[15px] text-[#717182]/60 md:ml-[176px]">
                <span className="h-3 w-px bg-black/5" />
                {item.note}
              </div>
            ) : null}

            <div className="grid items-center gap-4 md:grid-cols-[160px_minmax(0,1fr)_140px]">
              <div className="md:text-right">
                <div className="text-[11px] font-semibold leading-[16.5px] text-[#0A0A0A]">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[9px] leading-[13.5px] text-[#717182]">
                  {item.description}
                </div>
              </div>

              <div className="h-8 overflow-hidden rounded-lg bg-black/[0.03]">
                <div
                  className={`h-full rounded-lg opacity-85 ${item.colorClass}`}
                  style={{ width: `${Math.max(item.ratio * 100, 5)}%` }}
                />
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xl font-bold leading-5 ${item.valueClass}`}
                >
                  {item.value}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold leading-[15px] ${item.badgeClass}`}
                >
                  {item.badge}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-5 pl-0 text-[9px] font-mono leading-[13.5px] text-[#717182]/50 md:pl-[176px] md:pr-[156px]">
          {scale.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
