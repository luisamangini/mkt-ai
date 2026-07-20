export type LeadStage =
  | "novo"
  | "qualificado"
  | "em_negociacao"
  | "fechado"
  | "perdido";

export type LeadPriority = "alta" | "normal";

export type LeadTemperature = "quente" | "morno" | "frio";

export type ColumnAccent = "blue" | "purple" | "orange" | "green" | "red";

export interface Lead {
  id: string;
  name: string;
  stage: LeadStage;
  objective: string;
  amount: string;
  source: string;
  date: string;
  priority: LeadPriority;
  progress?: number;
  suggestion?: string;
  phone?: string;
  temperature?: LeadTemperature;
}

export interface KanbanColumnData {
  id: LeadStage;
  title: string;
  count: number;
  leads: Lead[];
  accent: ColumnAccent;
}
