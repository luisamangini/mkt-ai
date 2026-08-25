"use client";

import { Popover } from "@base-ui/react/popover";
import { Select } from "@base-ui/react/select";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

function monday(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() + (result.getDay() === 0 ? -6 : 1 - result.getDay()));
  return result;
}

const triggerClass = "flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-2 text-left text-[11px] text-foreground outline-none transition-colors hover:bg-muted focus:border-black/20 focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:opacity-60";

export function ScheduleDatePicker({ value, onChange, disabled }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = localDate(value) ?? new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const selected = localDate(value);
  const today = new Date();
  const todayKey = dateKey(today);

  useEffect(() => {
    const next = localDate(value);
    if (next) void Promise.resolve().then(() => setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1)));
  }, [value]);

  const days = useMemo(() => {
    const first = monday(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(first);
      day.setDate(first.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger disabled={disabled} className={triggerClass} aria-label="Selecionar data de publicação">
        <span className={value ? "" : "text-muted-foreground"}>{selected ? selected.toLocaleDateString("pt-BR") : "Selecionar data"}</span>
        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <Popover.Popup className="w-[280px] rounded-[10px] border border-border bg-card p-3 shadow-lg shadow-black/10 outline-none">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mês anterior" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-[11px] font-semibold capitalize text-foreground">{visibleMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
              <button type="button" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Próximo mês" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {weekDays.map((day) => <span key={day} className="py-1 text-center text-[9px] font-medium text-muted-foreground">{day}</span>)}
              {days.map((day) => {
                const key = dateKey(day);
                const active = key === value;
                const current = key === todayKey;
                const outside = day.getMonth() !== visibleMonth.getMonth();
                return <button key={key} type="button" onClick={() => { onChange(key); setOpen(false); }} aria-label={day.toLocaleDateString("pt-BR")} aria-pressed={active} className={`flex h-8 items-center justify-center rounded-md text-[10px] transition-colors ${active ? "bg-[#030213] font-medium text-white" : outside ? "text-muted-foreground/40 hover:bg-muted" : "text-foreground hover:bg-muted"} ${current && !active ? "ring-1 ring-inset ring-black/20" : ""}`}>{day.getDate()}</button>;
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
              <button type="button" onClick={() => { onChange(todayKey); setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setOpen(false); }} className="rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground">Hoje</button>
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground">Limpar</button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ScheduleTimePicker({ value, onChange, disabled }: PickerProps) {
  const [hour, minute] = /^\d{2}:\d{2}$/.test(value) ? value.split(":") : ["", ""];
  const hours = Array.from({ length: 24 }, (_, index) => ({ value: String(index).padStart(2, "0"), label: String(index).padStart(2, "0") }));
  const minutes = Array.from({ length: 12 }, (_, index) => ({ value: String(index * 5).padStart(2, "0"), label: String(index * 5).padStart(2, "0") }));

  function selectHour(nextHour: string) {
    onChange(`${nextHour}:${minute || "00"}`);
  }

  function selectMinute(nextMinute: string) {
    onChange(`${hour || "00"}:${nextMinute}`);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2"><TimePartSelect label="Hora" value={hour} options={hours} disabled={disabled} onChange={selectHour} /><TimePartSelect label="Minuto" value={minute} options={minutes} disabled={disabled} onChange={selectMinute} /></div>
      {value ? <button type="button" onClick={() => onChange("")} disabled={disabled} className="mt-1 rounded-md px-1.5 py-1 text-[9px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">Limpar horário</button> : null}
    </div>
  );
}

function TimePartSelect({ label, value, options, disabled, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; disabled?: boolean; onChange: (value: string) => void }) {
  return <label className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}<Select.Root items={options} value={value || null} disabled={disabled} onValueChange={(next) => { if (next) onChange(next); }}><Select.Trigger className="mt-1 flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-2 text-[11px] font-normal normal-case text-foreground outline-none transition-colors hover:bg-muted focus:border-foreground/20 focus:ring-2 focus:ring-foreground/5 disabled:opacity-60"><Select.Value placeholder="--" /><Select.Icon><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></Select.Icon></Select.Trigger><Select.Portal><Select.Positioner side="bottom" align="start" sideOffset={4} className="z-[70]"><Select.Popup className="max-h-52 w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg outline-none"><Select.List>{options.map((option) => <Select.Item key={option.value} value={option.value} className="flex h-8 items-center rounded-md px-2 text-[11px] font-normal normal-case text-foreground outline-none data-[highlighted]:bg-muted"><Select.ItemText>{option.label}</Select.ItemText></Select.Item>)}</Select.List></Select.Popup></Select.Positioner></Select.Portal></Select.Root></label>;
}
