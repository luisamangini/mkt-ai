import { Bot, BriefcaseBusiness } from "lucide-react";

import type { Lead } from "@/types/crm";

type LeadCardProps = {
  lead: Lead;
  selected: boolean;
  onSelect: (lead: Lead) => void;
};

const priorityClass: Record<Lead["priority"], string> = {
  alta: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-gray-200 bg-gray-50 text-gray-500",
};

export function LeadCard({ lead, selected, onSelect }: LeadCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className={`w-full cursor-pointer rounded-[10px] border bg-white p-3 text-left transition-colors hover:border-black/20 ${
        selected ? "border-[#0A0A0A]" : "border-black/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-5 text-[#0A0A0A]">
            {lead.name}
          </div>
          <div className="mt-0.5 text-[10px] leading-4 text-[#717182]">
            {lead.id}
          </div>
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase leading-3 ${priorityClass[lead.priority]}`}
        >
          {lead.priority}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] leading-4 text-[#717182]">
        <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={1.7} />
        <span className="text-[#0A0A0A]">{lead.objective}</span>
        <span>·</span>
        <span>{lead.amount}</span>
      </div>

      {typeof lead.progress === "number" ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] leading-3 text-[#717182]">
            <span>Progresso</span>
            <span>{lead.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#030213]"
              style={{ width: `${lead.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-[10px] leading-4 text-[#717182]">
        <span>{lead.source}</span>
        <span>{lead.date}</span>
      </div>

      {lead.suggestion ? (
        <div className="mt-3 rounded-md border border-black/5 bg-gray-50 p-2">
          <div className="mb-1 flex items-center gap-1.5 text-[9px] font-medium uppercase leading-3 tracking-wide text-[#717182]">
            <Bot className="h-3 w-3" strokeWidth={1.7} />
            IA
          </div>
          <p className="text-[10px] leading-4 text-[#717182]">
            {lead.suggestion}
          </p>
        </div>
      ) : null}
    </button>
  );
}
