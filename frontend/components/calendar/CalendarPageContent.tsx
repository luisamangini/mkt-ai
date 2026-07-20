"use client";

import { useMemo, useState } from "react";
import type {
  CalendarContentItem,
  CalendarDay,
  CalendarView,
} from "@/types/calendar";
import { CalendarDetailsPanel } from "./CalendarDetailsPanel";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarToolbar } from "./CalendarToolbar";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { WeeklyCalendar } from "./WeeklyCalendar";

const MOCK_TODAY = "2025-07-02";

const MOCK_CONTENT_ITEMS: CalendarContentItem[] = [
  {
    id: "CAL-001",
    title: "Mito do consorcio #3",
    date: "2025-06-30",
    time: "18:00",
    format: "carrossel",
    pillar: "mitos",
    status: "publicado",
    suggestedBestTime: "18:00",
    sourceContentId: "C-045",
    description: "Carrossel educativo para quebrar objecoes comuns sobre consorcio.",
  },
  {
    id: "CAL-002",
    title: "Depoimento Carlos - Imovel",
    date: "2025-07-01",
    time: "12:00",
    format: "reel",
    pillar: "prova_social",
    status: "publicado",
    suggestedBestTime: "12:00",
    sourceContentId: "C-046",
    description: "Reel de prova social com foco no caso de compra de imovel.",
  },
  {
    id: "CAL-003",
    title: "Stories Q&A semana",
    date: "2025-07-01",
    time: "20:00",
    format: "stories",
    pillar: "atualidades",
    status: "publicado",
    suggestedBestTime: "20:00",
    sourceContentId: "C-044",
    description: "Sequencia de stories para responder duvidas rapidas da audiencia.",
  },
  {
    id: "CAL-004",
    title: "Selic e consorcio - oportunidade",
    date: "2025-07-02",
    time: "18:00",
    format: "reel",
    pillar: "atualidades",
    status: "aprovacao",
    suggestedBestTime: "18:00",
    sourceContentId: "C-047",
    description: "Reel conectando a queda da Selic com decisoes de compra planejada.",
  },
  {
    id: "CAL-005",
    title: "Por que consorcio > financiamento",
    date: "2025-07-02",
    time: "19:00",
    format: "carrossel",
    pillar: "educacao_financeira",
    status: "rascunho",
    suggestedBestTime: "19:00",
    sourceContentId: "C-043",
    description: "Comparativo simples entre financiamento e consorcio para leads em consideracao.",
  },
  {
    id: "CAL-006",
    title: "Lance embutido explicado",
    date: "2025-07-03",
    time: "18:00",
    format: "reel",
    pillar: "educacao_financeira",
    status: "agendado",
    suggestedBestTime: "18:00",
    sourceContentId: "C-042",
    description: "Roteiro curto para explicar lance embutido sem prometer contemplacao.",
  },
  {
    id: "CAL-007",
    title: "CTA - vagas abertas julho",
    date: "2025-07-04",
    time: "20:00",
    format: "stories",
    pillar: "conversao",
    status: "agendado",
    suggestedBestTime: "20:00",
    description: "Stories com chamada direta para simulacao e conversa no direct.",
  },
  {
    id: "CAL-008",
    title: "Simulacao imovel ao vivo",
    date: "2025-07-04",
    time: "18:00",
    format: "reel",
    pillar: "educacao_financeira",
    status: "agendado",
    suggestedBestTime: "18:00",
    description: "Reel com simulacao didatica de carta de credito para imovel.",
  },
  {
    id: "CAL-009",
    title: "Motivacional da semana",
    date: "2025-07-06",
    time: "09:00",
    format: "stories",
    pillar: "prova_social",
    status: "agendado",
    suggestedBestTime: "09:00",
    description: "Stories leve para reforcar planejamento financeiro no inicio da semana.",
  },
  {
    id: "CAL-010",
    title: "Financiamento caro: o que observar",
    date: "2025-07-08",
    time: "18:00",
    format: "reel",
    pillar: "educacao_financeira",
    status: "agendado",
    suggestedBestTime: "18:00",
    sourceContentId: "C-047",
    description: "Conteudo de meio de funil sobre custo total e planejamento.",
  },
  {
    id: "CAL-011",
    title: "Cliente contemplado em junho",
    date: "2025-07-10",
    time: "12:00",
    format: "reel",
    pillar: "prova_social",
    status: "aprovacao",
    suggestedBestTime: "12:00",
    description: "Prova social para reduzir inseguranca de novos leads.",
  },
  {
    id: "CAL-012",
    title: "Quiz: consorcio tem juros?",
    date: "2025-07-15",
    time: "20:00",
    format: "stories",
    pillar: "mitos",
    status: "rascunho",
    suggestedBestTime: "20:00",
    description: "Sequencia interativa para corrigir percepcao sobre taxa de administracao.",
  },
  {
    id: "CAL-013",
    title: "Checklist antes de comprar seu carro",
    date: "2025-07-22",
    time: "18:00",
    format: "carrossel",
    pillar: "conversao",
    status: "agendado",
    suggestedBestTime: "18:00",
    description: "Carrossel de conversao com criterios para simulacao de veiculo.",
  },
];

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function toDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getMonday(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function getItemsByDate(items: CalendarContentItem[]) {
  return items.reduce<Record<string, CalendarContentItem[]>>((acc, item) => {
    acc[item.date] = [...(acc[item.date] ?? []), item];
    return acc;
  }, {});
}

function buildWeekDays(date: Date, items: CalendarContentItem[]): CalendarDay[] {
  const start = getMonday(date);
  const itemsByDate = getItemsByDate(items);

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    const dateKey = toDateKey(day);

    return {
      date: dateKey,
      dayLabel: dayLabels[day.getDay()],
      isToday: dateKey === MOCK_TODAY,
      isCurrentMonth: true,
      items: itemsByDate[dateKey] ?? [],
    };
  });
}

function buildMonthDays(date: Date, items: CalendarContentItem[]): CalendarDay[] {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstGridDay = getMonday(monthStart);
  const itemsByDate = getItemsByDate(items);

  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(firstGridDay, index);
    const dateKey = toDateKey(day);

    return {
      date: dateKey,
      dayLabel: dayLabels[day.getDay()],
      isToday: dateKey === MOCK_TODAY,
      isCurrentMonth: day.getMonth() === date.getMonth(),
      items: itemsByDate[dateKey] ?? [],
    };
  });
}

export function CalendarPageContent() {
  const [view, setView] = useState<CalendarView>("weekly");
  const [currentDate, setCurrentDate] = useState(() => toDate(MOCK_TODAY));
  const [selectedItem, setSelectedItem] = useState<CalendarContentItem | null>(null);

  const days = useMemo(
    () =>
      view === "weekly"
        ? buildWeekDays(currentDate, MOCK_CONTENT_ITEMS)
        : buildMonthDays(currentDate, MOCK_CONTENT_ITEMS),
    [currentDate, view],
  );

  function handlePrevious() {
    setCurrentDate((date) =>
      view === "weekly" ? addDays(date, -7) : addMonths(date, -1),
    );
  }

  function handleNext() {
    setCurrentDate((date) =>
      view === "weekly" ? addDays(date, 7) : addMonths(date, 1),
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-[10px] border border-black/10 bg-white">
      <section className="min-w-0 flex-1">
        <CalendarToolbar
          view={view}
          currentDate={currentDate}
          onViewChange={setView}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
        <CalendarLegend />
        {view === "weekly" ? (
          <WeeklyCalendar
            days={days}
            selectedItemId={selectedItem?.id}
            onSelectItem={setSelectedItem}
          />
        ) : (
          <MonthlyCalendar
            days={days}
            selectedItemId={selectedItem?.id}
            onSelectItem={setSelectedItem}
          />
        )}
      </section>

      {selectedItem ? (
        <CalendarDetailsPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      ) : null}
    </div>
  );
}
