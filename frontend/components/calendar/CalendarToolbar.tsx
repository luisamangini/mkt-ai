import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarView } from "@/types/calendar";

type CalendarToolbarProps = {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function getWeekNumber(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - firstDay.getTime();
  return Math.ceil((diff / 86400000 + firstDay.getDay() + 1) / 7);
}

export function CalendarToolbar({
  view,
  currentDate,
  onViewChange,
  onPrevious,
  onNext,
}: CalendarToolbarProps) {
  const period =
    view === "monthly"
      ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : `Semana de ${currentDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })}`;
  const secondary =
    view === "monthly"
      ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : `Semana ${getWeekNumber(currentDate)}`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPrevious} className="flex h-8 w-8 items-center justify-center rounded-md border border-black/10 hover:bg-gray-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="text-sm font-semibold text-[#0A0A0A]">{period}</div>
          <div className="text-[11px] text-[#717182]">{secondary}</div>
        </div>
        <button type="button" onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-md border border-black/10 hover:bg-gray-50">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex rounded-md border border-black/10 bg-white p-0.5">
        {(["weekly", "monthly"] as CalendarView[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onViewChange(item)}
            className={`h-8 rounded px-3 text-[11px] font-medium ${
              view === item ? "bg-gray-100 text-[#0A0A0A]" : "text-[#717182]"
            }`}
          >
            {item === "weekly" ? "Semanal" : "Mensal"}
          </button>
        ))}
      </div>
    </header>
  );
}
