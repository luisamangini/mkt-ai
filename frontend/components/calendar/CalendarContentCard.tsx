import type { CalendarContentItem, CalendarPillar, CalendarStatus } from "@/types/calendar";

type CalendarContentCardProps = {
  item: CalendarContentItem;
  compact?: boolean;
  selected?: boolean;
  onClick: (item: CalendarContentItem) => void;
};

export const pillarClasses: Record<CalendarPillar, string> = {
  atualidades: "border-[#51A2FF]/20 bg-[#51A2FF]/10 text-[#2B7FFF]",
  educacao_financeira: "border-[#8E51FF]/20 bg-[#8E51FF]/10 text-[#8E51FF]",
  mitos: "border-amber-200 bg-amber-50 text-amber-700",
  prova_social: "border-[#05DF72]/20 bg-[#05DF72]/10 text-green-600",
  conversao: "border-red-200 bg-red-50 text-red-500",
};

export const pillarLabels: Record<CalendarPillar, string> = {
  atualidades: "Atualidades",
  educacao_financeira: "Ed. Financeira",
  mitos: "Mitos",
  prova_social: "Prova Social",
  conversao: "Conversão",
};

export const statusLabels: Record<CalendarStatus, string> = {
  publicado: "Publicado",
  aprovacao: "Aprovação",
  agendado: "Agendado",
  rascunho: "Rascunho",
};

const statusText: Record<CalendarStatus, string> = {
  publicado: "text-green-600",
  aprovacao: "text-amber-700",
  agendado: "text-[#2B7FFF]",
  rascunho: "text-[#717182]",
};

export function CalendarContentCard({
  item,
  compact = false,
  selected,
  onClick,
}: CalendarContentCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick(item)}
        className={`flex w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left hover:bg-gray-50 ${
          selected ? "border-[#0A0A0A]" : "border-black/10"
        }`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${pillarClasses[item.pillar].split(" ")[1]}`} />
        <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-[#0A0A0A]">
          {item.time ? `${item.time} · ` : ""}
          {item.title}
        </span>
        <span className={`shrink-0 text-[9px] ${statusText[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`w-full rounded-[10px] border bg-white p-3 text-left transition-colors hover:border-black/20 ${
        selected ? "border-[#0A0A0A]" : "border-black/10"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${pillarClasses[item.pillar]}`}>
          {pillarLabels[item.pillar]}
        </span>
        <span className="text-[10px] text-[#717182]">{item.time}</span>
      </div>
      <div className="text-[12px] font-semibold leading-4 text-[#0A0A0A]">
        {item.title}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-[#717182]">
        <span>{item.format}</span>
        <span className={statusText[item.status]}>{statusLabels[item.status]}</span>
      </div>
    </button>
  );
}
