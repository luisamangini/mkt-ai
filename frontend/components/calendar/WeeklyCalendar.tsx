import type { CalendarContentItem, CalendarDay } from "@/types/calendar";
import { CalendarDayColumn } from "./CalendarDayColumn";

type WeeklyCalendarProps = {
  days: CalendarDay[];
  selectedItemId?: string;
  onSelectItem: (item: CalendarContentItem) => void;
};

export function WeeklyCalendar({
  days,
  selectedItemId,
  onSelectItem,
}: WeeklyCalendarProps) {
  return (
    <div className="overflow-x-auto p-5">
      <div className="grid min-w-[1120px] grid-cols-5 gap-3 xl:min-w-0">
        {days.slice(0, 5).map((day) => (
          <CalendarDayColumn
            key={day.date}
            day={day}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
      <div className="mt-3 grid min-w-[448px] grid-cols-2 gap-3 xl:w-[40%]">
        {days.slice(5).map((day) => (
          <CalendarDayColumn
            key={day.date}
            day={day}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
          />
        ))}
      </div>
    </div>
  );
}
