import { CalendarDays, Clock3, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import type { CalendarContentItem } from "@/types/calendar";
import { pillarLabels, statusLabels } from "./CalendarContentCard";

type CalendarDetailsPanelProps = {
  item: CalendarContentItem;
  onClose: () => void;
};

export function CalendarDetailsPanel({ item, onClose }: CalendarDetailsPanelProps) {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-black/10 bg-white">
      <div className="flex items-start justify-between border-b border-black/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-[#0A0A0A]">
            {item.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-[#717182]">{item.id}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar detalhe" className="flex h-8 w-8 items-center justify-center rounded-md text-[#717182] hover:bg-gray-50 hover:text-[#0A0A0A]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5 text-[11px] text-[#717182]">
        <section className="grid grid-cols-2 gap-2">
          <Info label="Data" value={item.date} />
          <Info label="Horário" value={item.time ?? "Sem horário"} />
          <Info label="Formato" value={item.format} />
          <Info label="Pilar" value={pillarLabels[item.pillar]} />
          <Info label="Status" value={statusLabels[item.status]} />
        </section>

        <section className="rounded-[10px] border border-black/10 bg-gray-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#0A0A0A]">
            <Clock3 className="h-4 w-4" />
            Melhor horário sugerido para este formato: {item.suggestedBestTime}
          </div>
          <p>
            Horário sugerido com base no formato e padrão atual de audiência.
          </p>
        </section>

        <Detail title="Descrição">
          {item.description ?? "Conteúdo planejado para o calendário editorial."}
        </Detail>

        <Detail title="Origem">
          {item.sourceContentId ? `Conteúdo relacionado: ${item.sourceContentId}` : "Sem origem vinculada"}
        </Detail>

        <div className="space-y-2 pt-1">
          <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#030213] text-[11px] font-medium text-white">
            <Pencil className="h-3.5 w-3.5" />
            Editar agendamento
          </button>
          <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-black/10 text-[11px] font-medium text-[#0A0A0A] hover:bg-gray-50">
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir conteúdo
          </button>
          <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-[11px] font-medium text-red-500 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
            Remover do calendário
          </button>
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#717182]">
        <CalendarDays className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[11px] font-medium text-[#0A0A0A]">{value}</div>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#717182]">
        {title}
      </h3>
      <p className="leading-5">{children}</p>
    </section>
  );
}
