import type {
  ContentFormat,
  ContentOrigin,
  ContentPillar,
  ContentStatus,
} from "@/types/content";

export type CalendarView = "weekly" | "monthly";
export type CalendarPillar = ContentPillar;
export type CalendarStatus = ContentStatus;
export type CalendarFormat = ContentFormat;

export interface CalendarContentItem {
  id: string;
  executionId: string;
  contentIndex: number;
  title: string;
  date: string;
  time?: string;
  format: CalendarFormat;
  pillar: CalendarPillar;
  status: CalendarStatus;
  origin: ContentOrigin;
  description?: string;
}

export interface CalendarDay {
  date: string;
  dayLabel: string;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  items: CalendarContentItem[];
}

export interface ScheduleTarget {
  executionId: string;
  contentIndex: number;
}
