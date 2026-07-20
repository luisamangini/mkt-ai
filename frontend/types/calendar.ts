export type CalendarView = "weekly" | "monthly";

export type CalendarPillar =
  | "atualidades"
  | "educacao_financeira"
  | "mitos"
  | "prova_social"
  | "conversao";

export type CalendarStatus =
  | "publicado"
  | "aprovacao"
  | "agendado"
  | "rascunho";

export type CalendarFormat = "reel" | "carrossel" | "stories";

export interface CalendarContentItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  format: CalendarFormat;
  pillar: CalendarPillar;
  status: CalendarStatus;
  suggestedBestTime?: string;
  sourceContentId?: string;
  description?: string;
}

export interface CalendarDay {
  date: string;
  dayLabel: string;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  items: CalendarContentItem[];
}
