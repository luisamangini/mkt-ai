import type { ColumnAccent, KanbanColumnData, Lead } from "@/types/crm";

import { LeadCard } from "./LeadCard";

type KanbanColumnProps = {
  column: KanbanColumnData;
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
};

const accentClass: Record<ColumnAccent, string> = {
  blue: "border-[#51A2FF]/25 bg-[#51A2FF]/10 text-[#51A2FF]",
  purple: "border-[#8E51FF]/25 bg-[#8E51FF]/10 text-[#8E51FF]",
  orange: "border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#F59E0B]",
  green: "border-[#05DF72]/25 bg-[#05DF72]/10 text-[#05DF72]",
  red: "border-red-400/20 bg-red-400/10 text-red-400",
};

export function KanbanColumn({
  column,
  selectedLeadId,
  onSelectLead,
}: KanbanColumnProps) {
  return (
    <section className="flex min-h-[620px] w-[244px] shrink-0 flex-col rounded-[10px] border border-black/10 bg-gray-50/50 p-2.5">
      <header
        className={`mb-3 flex items-center justify-between rounded-lg border px-3 py-2 ${accentClass[column.accent]}`}
      >
        <h2 className="text-xs font-semibold leading-4 text-[#0A0A0A]">
          {column.title}
        </h2>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium leading-4 text-[#717182]">
          {column.count}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2.5">
        {column.leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={lead.id === selectedLeadId}
            onSelect={onSelectLead}
          />
        ))}
      </div>

      <button
        type="button"
        className="mt-3 h-9 rounded-lg border border-dashed border-black/15 text-[11px] font-medium text-[#717182] transition-colors hover:border-black/25 hover:text-[#0A0A0A]"
      >
        + Adicionar lead
      </button>
    </section>
  );
}
