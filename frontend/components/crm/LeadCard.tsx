import { BriefcaseBusiness } from "lucide-react";
import type { DragEvent } from "react";
import type { Lead } from "@/types/crm";

type Props = { lead: Lead; selected: boolean; onSelect: (lead: Lead) => void; onDragStart: (event: DragEvent<HTMLDivElement>) => void };

const originLabel: Record<string, string> = {
  meta_ads: "Meta Ads",
  instagram_organico: "Instagram orgânico",
  indicacao: "Indicação",
  direct: "Direct",
  outro: "Outra origem",
  manual: "Manual",
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export function LeadCard({ lead, selected, onSelect, onDragStart }: Props) {
  const created = new Date(lead.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(" de ", " ").replace(".", "");
  const isMetaAds = lead.source === "meta_ads";
  return <div role="button" tabIndex={0} draggable onDragStart={onDragStart} onClick={() => onSelect(lead)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(lead); }} className={`w-full cursor-grab rounded-[10px] border p-3 text-left transition-colors active:cursor-grabbing ${isMetaAds ? "bg-blue-50/40 dark:bg-blue-950/15" : "bg-card"} ${selected ? "border-foreground" : isMetaAds ? "border-blue-200/60 dark:border-blue-800/40" : "border-border"}`}>
    <div className="flex items-start justify-between gap-2"><div className="truncate text-[13px] font-semibold text-foreground">{lead.name}</div><div className="flex shrink-0 gap-1">{lead.needsFollowup ? <span className="rounded border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">Follow-up pendente · {lead.inactiveDays} dias</span> : null}{lead.coldLead ? <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">Frio</span> : null}</div></div>
    {lead.objective || lead.amount ? <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={1.7} />{lead.objective ? <span className="text-foreground">{lead.objective}</span> : null}{lead.objective && lead.amount ? <span>·</span> : null}{lead.amount ? <span>{money(lead.amount)}</span> : null}</div> : null}
    <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span className={isMetaAds ? "rounded-full bg-blue-100/70 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : ""}>{originLabel[lead.source] || lead.source || "Origem não informada"}</span><span>{created}</span></div>
  </div>;
}
