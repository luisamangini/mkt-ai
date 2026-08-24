import type { ColumnAccent, KanbanColumnData, Lead, LeadStage } from "@/types/crm";
import { KanbanColumn } from "./KanbanColumn";

type Props = { compact?: boolean; leads: Lead[]; selectedLead: Lead | null; onSelectLead: (lead: Lead) => void; onMoveLead: (leadId: string, stage: LeadStage) => Promise<void> };

const definitions: Array<{ id: LeadStage; title: string; accent: ColumnAccent }> = [
  { id: "novo", title: "Novo", accent: "blue" },
  { id: "qualificado", title: "Qualificado", accent: "purple" },
  { id: "em_negociacao", title: "Em Negociação", accent: "orange" },
  { id: "fechado", title: "Fechado", accent: "green" },
  { id: "perdido", title: "Perdido", accent: "red" },
];

export function CrmBoard({ compact = false, leads, selectedLead, onSelectLead, onMoveLead }: Props) {
  const columns: KanbanColumnData[] = definitions.map((definition) => {
    const columnLeads = leads.filter((lead) => lead.stage === definition.id);
    return { ...definition, count: columnLeads.length, leads: columnLeads };
  });
  return <div className="min-h-0 w-full overflow-x-auto"><div className={`flex gap-3 p-5 ${compact ? "min-w-max [&>section]:w-[244px] [&>section]:flex-none" : "min-w-full [&>section]:min-w-[230px] [&>section]:flex-1 [&>section]:shrink"}`}>{columns.map((column) => <KanbanColumn key={column.id} column={column} selectedLeadId={selectedLead?.id} onSelectLead={onSelectLead} onMoveLead={onMoveLead} />)}</div></div>;
}
