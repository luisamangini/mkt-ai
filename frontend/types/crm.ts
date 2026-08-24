export type LeadStage =
  | "novo"
  | "qualificado"
  | "em_negociacao"
  | "fechado"
  | "perdido";

export type ColumnAccent = "blue" | "purple" | "orange" | "green" | "red";

export interface Lead {
  id: string;
  name: string;
  stage: LeadStage;
  whatsapp: string;
  email?: string;
  source: string;
  createdAt: string;
  objective?: string;
  amount?: number;
  usageDeadline?: string;
  knowsConsortium?: string;
  notes?: string;
  lastContact?: string;
  lastActivity?: string;
  inactiveDays: number;
  qualified?: boolean;
  needsFollowup?: boolean;
  coldLead?: boolean;
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  type: string;
  note: string;
  createdAt: string;
  nextStep?: string;
}

export interface KanbanColumnData {
  id: LeadStage;
  title: string;
  count: number;
  leads: Lead[];
  accent: ColumnAccent;
}

export interface CreateLeadInput {
  name: string;
  whatsapp: string;
  email?: string;
  source: string;
  stage: LeadStage;
  objective?: string;
  amount?: number;
  usageDeadline?: string;
  knowsConsortium?: string;
  notes?: string;
}

export interface CreateInteractionInput {
  note: string;
  nextStep?: string;
}
