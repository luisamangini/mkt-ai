"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchContentItems } from "@/services/content";
import { fetchCalendarItems, scheduleContent, unscheduleContent } from "@/services/calendar";
import type { ContentItem } from "@/types/content";
import type { CalendarContentItem, CalendarDay, CalendarView } from "@/types/calendar";
import { CalendarDetailsPanel } from "./CalendarDetailsPanel";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarToolbar } from "./CalendarToolbar";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { WeeklyCalendar } from "./WeeklyCalendar";

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, days: number) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
const addMonths = (date: Date, months: number) => { const next = new Date(date); next.setMonth(next.getMonth() + months); return next; };
const getMonday = (date: Date) => addDays(date, date.getDay() === 0 ? -6 : 1 - date.getDay());

function period(date: Date, view: CalendarView) {
  const start = view === "weekly" ? getMonday(date) : getMonday(new Date(date.getFullYear(), date.getMonth(), 1));
  const end = addDays(start, view === "weekly" ? 6 : 41);
  return { start: toDateKey(start), end: toDateKey(end) };
}

function buildDays(date: Date, view: CalendarView, items: CalendarContentItem[]): CalendarDay[] {
  const start = view === "weekly" ? getMonday(date) : getMonday(new Date(date.getFullYear(), date.getMonth(), 1));
  const count = view === "weekly" ? 7 : 42;
  const today = toDateKey(new Date());
  const byDate = items.reduce<Record<string, CalendarContentItem[]>>((result, item) => {
    result[item.date] = [...(result[item.date] ?? []), item]; return result;
  }, {});
  return Array.from({ length: count }, (_, index) => {
    const day = addDays(start, index); const key = toDateKey(day);
    return { date: key, dayLabel: dayLabels[day.getDay()], isToday: key === today, isCurrentMonth: view === "weekly" || day.getMonth() === date.getMonth(), items: byDate[key] ?? [] };
  });
}

export function CalendarPageContent() {
  const router = useRouter();
  const [view, setView] = useState<CalendarView>("weekly");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [items, setItems] = useState<CalendarContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addDate, setAddDate] = useState<string | null>(null);
  const [available, setAvailable] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState("");
  const [addTime, setAddTime] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const visiblePeriod = useMemo(() => period(currentDate, view), [currentDate, view]);
  const days = useMemo(() => buildDays(currentDate, view, items), [currentDate, items, view]);

  useEffect(() => {
    let active = true; setLoading(true); setError("");
    fetchCalendarItems(visiblePeriod.start, visiblePeriod.end)
      .then((result) => { if (active) setItems(result); })
      .catch((cause) => { if (active) { setItems([]); setError(cause instanceof Error ? cause.message : "Não foi possível carregar o calendário."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visiblePeriod.end, visiblePeriod.start]);

  async function openAdd(date: string) {
    setAddDate(date); setSelectedContentId(""); setAddTime(""); setModalError(""); setModalLoading(true);
    try {
      const [contents, scheduled] = await Promise.all([fetchContentItems(), fetchCalendarItems("2000-01-01", "2100-12-31")]);
      const scheduledIds = new Set(scheduled.map((item) => item.id));
      setAvailable(contents.filter((item) => !scheduledIds.has(`${item.executionId}:${item.contentIndex}`)));
    } catch (cause) { setModalError(cause instanceof Error ? cause.message : "Não foi possível carregar os conteúdos."); }
    finally { setModalLoading(false); }
  }

  async function addSchedule() {
    const content = available.find((item) => item.id === selectedContentId);
    if (!content || !addDate) return;
    setModalLoading(true); setModalError("");
    try {
      const scheduled = await scheduleContent(content, addDate, addTime || undefined);
      setItems((current) => [...current.filter((item) => item.id !== scheduled.id), scheduled]);
      setAddDate(null);
    } catch (cause) { setModalError(cause instanceof Error ? cause.message : "Não foi possível agendar o conteúdo."); }
    finally { setModalLoading(false); }
  }

  async function editSchedule(date: string, time?: string) {
    if (!selectedItem) return;
    const updated = await scheduleContent(selectedItem, date, time);
    setItems((current) => [...current.filter((item) => item.id !== updated.id), updated]);
    setSelectedItem(updated);
  }

  async function removeSchedule() {
    if (!selectedItem) return;
    await unscheduleContent(selectedItem);
    setItems((current) => current.filter((item) => item.id !== selectedItem.id));
    setSelectedItem(null);
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-[10px] border border-border bg-card">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CalendarToolbar view={view} currentDate={currentDate} onViewChange={setView} onPrevious={() => setCurrentDate((date) => view === "weekly" ? addDays(date, -7) : addMonths(date, -1))} onNext={() => setCurrentDate((date) => view === "weekly" ? addDays(date, 7) : addMonths(date, 1))} />
        <CalendarLegend />
        {error ? <p className="px-5 py-3 text-xs text-red-500">{error}</p> : null}
        {loading ? <p className="px-5 py-3 text-xs text-muted-foreground">Carregando calendário...</p> : null}
        {!loading && !error && items.length === 0 ? <p className="px-5 py-3 text-xs text-muted-foreground">Nenhum conteúdo agendado neste período.</p> : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {view === "weekly" ? <WeeklyCalendar days={days} selectedItemId={selectedItem?.id} onSelectItem={setSelectedItem} onAdd={openAdd} /> : <MonthlyCalendar days={days} selectedItemId={selectedItem?.id} onSelectItem={setSelectedItem} onAdd={openAdd} />}
        </div>
      </section>
      {selectedItem ? <CalendarDetailsPanel item={selectedItem} onClose={() => setSelectedItem(null)} onSchedule={editSchedule} onUnschedule={removeSchedule} onOpenContent={() => router.push("/content")} /> : null}

      {addDate ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-[10px] bg-card p-5 shadow-xl">
          <h2 className="text-sm font-semibold text-foreground">Adicionar ao calendário</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Data: {new Date(`${addDate}T00:00:00`).toLocaleDateString("pt-BR")}</p>
          {modalLoading ? <p className="mt-4 text-xs text-muted-foreground">Carregando...</p> : null}
          {!modalLoading && available.length === 0 && !modalError ? <p className="mt-4 text-xs text-muted-foreground">Nenhum conteúdo não agendado disponível.</p> : null}
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {available.map((content) => <button key={content.id} type="button" onClick={() => setSelectedContentId(content.id)} className={`w-full rounded-lg border p-3 text-left ${selectedContentId === content.id ? "border-[#0A0A0A]" : "border-border"}`}><div className="text-xs font-medium text-foreground">{content.title}</div><div className="mt-1 text-[10px] text-muted-foreground">{content.format} · {content.pillar} · {content.status}</div></button>)}
          </div>
          <label className="mt-4 block text-[11px] text-muted-foreground">Horário (opcional)<input type="time" value={addTime} onChange={(event) => setAddTime(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-border px-3 text-foreground" /></label>
          {modalError ? <p className="mt-3 text-xs text-red-500">{modalError}</p> : null}
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setAddDate(null)} disabled={modalLoading} className="h-9 rounded-md border border-border px-4 text-xs">Cancelar</button><button type="button" onClick={addSchedule} disabled={modalLoading || !selectedContentId} className="h-9 rounded-md bg-[#030213] px-4 text-xs text-white disabled:opacity-50">Agendar</button></div>
        </div>
      </div> : null}
    </div>
  );
}
