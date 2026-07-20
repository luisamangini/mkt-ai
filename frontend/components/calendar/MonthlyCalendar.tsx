import type { CalendarContentItem, CalendarDay } from "@/types/calendar";
import { CalendarMonthCell } from "./CalendarMonthCell";

type MonthlyCalendarProps = {
  days: CalendarDay[];
  selectedItemId?: string;
  onSelectItem: (item: CalendarContentItem) => void;
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthlyCalendar({
  days,
  selectedItemId,
  onSelectItem,
}: MonthlyCalendarProps) {
  return (
    <div className="overflow-x-auto p-5">
      <div className="min-w-[980px] overflow-hidden rounded-[10px] border border-black/10 bg-white">
        <div className="grid grid-cols-7 border-b border-black/10 bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#717182] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <CalendarMonthCell
              key={day.date}
              day={day}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
