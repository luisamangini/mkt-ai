import type { CalendarContentItem, CalendarDay } from "@/types/calendar";
import { CalendarContentCard } from "./CalendarContentCard";

type CalendarMonthCellProps = {
  day: CalendarDay;
  selectedItemId?: string;
  onSelectItem: (item: CalendarContentItem) => void;
  onAdd: (date: string) => void;
};

export function CalendarMonthCell({
  day,
  selectedItemId,
  onSelectItem,
  onAdd,
}: CalendarMonthCellProps) {
  const date = new Date(`${day.date}T00:00:00`);
  const visibleItems = day.items.slice(0, 3);
  const hiddenCount = day.items.length - visibleItems.length;

  return (
    <div
      className={`min-h-[132px] border-b border-r border-border bg-card p-2 ${
        day.isToday ? "bg-muted ring-1 ring-inset ring-black/20" : ""
      } ${day.isCurrentMonth ? "" : "opacity-40"}`}
    >
      <div className="mb-2 text-[11px] font-medium text-foreground">
        {date.getDate()}
      </div>
      <div className="space-y-1.5">
        {visibleItems.map((item) => (
          <CalendarContentCard
            key={item.id}
            item={item}
            compact
            selected={item.id === selectedItemId}
            onClick={onSelectItem}
          />
        ))}
        {hiddenCount > 0 ? (
          <div className="text-[10px] text-muted-foreground">
            +{hiddenCount} conteúdos
          </div>
        ) : null}
      </div>
      <button type="button" onClick={() => onAdd(day.date)} className="mt-2 text-[10px] font-medium text-muted-foreground hover:text-foreground">
        + adicionar
      </button>
    </div>
  );
}
