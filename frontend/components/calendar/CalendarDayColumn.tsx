import type { CalendarContentItem, CalendarDay } from "@/types/calendar";
import { CalendarContentCard } from "./CalendarContentCard";

type CalendarDayColumnProps = {
  day: CalendarDay;
  selectedItemId?: string;
  onSelectItem: (item: CalendarContentItem) => void;
};

export function CalendarDayColumn({
  day,
  selectedItemId,
  onSelectItem,
}: CalendarDayColumnProps) {
  const date = new Date(`${day.date}T00:00:00`);

  return (
    <section className="flex min-h-[420px] min-w-[220px] flex-1 flex-col rounded-[10px] border border-black/10 bg-gray-50/40 p-2.5">
      <header className="mb-3 flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2">
        <div>
          <div className="text-xs font-semibold text-[#0A0A0A]">
            {day.dayLabel}
          </div>
          <div className="text-[10px] text-[#717182]">
            {date.getDate().toString().padStart(2, "0")} Jul
          </div>
        </div>
        {day.isToday ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-[#0A0A0A]">
            hoje
          </span>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col gap-2">
        {day.items.map((item) => (
          <CalendarContentCard
            key={item.id}
            item={item}
            selected={item.id === selectedItemId}
            onClick={onSelectItem}
          />
        ))}
      </div>

      <button
        type="button"
        className="mt-3 h-9 rounded-lg border border-dashed border-black/15 text-[11px] font-medium text-[#717182] hover:border-black/25 hover:text-[#0A0A0A]"
      >
        + adicionar
      </button>
    </section>
  );
}
