import {
  Bot,
  ChevronRight,
  CircleX,
  Phone,
  Send,
  X,
} from "lucide-react";
import type { ComponentType } from "react";

import type { Lead } from "@/types/crm";

type LeadDetailsPanelProps = {
  lead: Lead;
  onClose: () => void;
};

const temperatureLabel = {
  quente: "QUENTE",
  morno: "MORNO",
  frio: "FRIO",
} as const;

export function LeadDetailsPanel({ lead, onClose }: LeadDetailsPanelProps) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-black/10 bg-white">
      <div className="flex items-start justify-between border-b border-black/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold leading-5 text-[#0A0A0A]">
            {lead.name}
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-[#717182]">
            {lead.id} · {lead.objective} {lead.amount}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes do lead"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#717182] transition-colors hover:bg-gray-50 hover:text-[#0A0A0A]"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-2">
          <InfoItem label="Telefone" value={lead.phone ?? "Não informado"} />
          <InfoItem label="Fonte" value={lead.source} />
          <InfoItem
            label="Lead"
            value={
              lead.temperature ? temperatureLabel[lead.temperature] : "MORNO"
            }
          />
          <InfoItem label="Prioridade" value={lead.priority} />
        </div>

        <section className="rounded-[10px] border border-[#8E51FF]/15 bg-[#8E51FF]/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold leading-4 text-[#0A0A0A]">
            <Bot className="h-4 w-4 text-[#8E51FF]" strokeWidth={1.8} />
            Sugestão da IA
          </div>
          <p className="text-[11px] leading-5 text-[#717182]">
            {lead.suggestion ?? "Nenhuma sugestão disponível para este lead."}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="h-8 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
            >
              Executar
            </button>
            <button
              type="button"
              className="h-8 px-2 text-[11px] font-medium text-[#717182]"
            >
              Ignorar
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <ActionButton icon={Send} label="Enviar Mensagem" variant="dark" />
          <ActionButton icon={Phone} label="Registrar Ligação" />
          <ActionButton icon={ChevronRight} label="Avançar Stage" />
          <ActionButton icon={CircleX} label="Marcar como Perdido" danger />
        </section>
      </div>
    </aside>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="text-[9px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
        {label}
      </div>
      <div className="mt-1 truncate text-[11px] font-medium leading-4 text-[#0A0A0A]">
        {value}
      </div>
    </div>
  );
}

type ActionButtonProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  variant?: "dark";
  danger?: boolean;
};

function ActionButton({
  icon: Icon,
  label,
  variant,
  danger,
}: ActionButtonProps) {
  if (variant === "dark") {
    return (
      <button
        type="button"
        className="flex h-9 w-full items-center gap-2 rounded-md bg-[#030213] px-3 text-left text-[11px] font-medium text-white"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-[11px] font-medium ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "border border-black/10 text-[#0A0A0A] hover:bg-gray-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      {label}
    </button>
  );
}
