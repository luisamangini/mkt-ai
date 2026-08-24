import type {
  CreateInteractionInput,
  CreateLeadInput,
  Lead,
  LeadInteraction,
  LeadStage,
} from "@/types/crm";

const DEFAULT_API_URL = "http://localhost:8000";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] as string : "";
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  return readString(record, key) || undefined;
}

function normalizeStage(value: string): LeadStage {
  if (value === "novo" || value === "qualificado" || value === "em_negociacao" || value === "fechado" || value === "perdido") return value;
  throw new Error(`Status de lead inválido: ${value || "vazio"}.`);
}

function normalizeLead(value: unknown): Lead {
  if (!isRecord(value)) throw new Error("Lead persistido possui formato inválido.");
  const id = readString(value, "id");
  const name = readString(value, "nome");
  const createdAt = readString(value, "criado_em");
  if (!id || !name || !createdAt) throw new Error("Lead persistido não possui campos obrigatórios.");
  return {
    id,
    name,
    stage: normalizeStage(readString(value, "status")),
    whatsapp: readString(value, "whatsapp"),
    email: readOptionalString(value, "email"),
    source: readString(value, "origem"),
    createdAt,
    objective: readOptionalString(value, "objetivo"),
    amount: typeof value.valor_carta === "number" ? value.valor_carta : undefined,
    usageDeadline: readOptionalString(value, "prazo_uso"),
    knowsConsortium: readOptionalString(value, "conhece_consorcio"),
    notes: readOptionalString(value, "observacoes"),
    lastContact: readOptionalString(value, "ultimo_contato"),
    lastActivity: readOptionalString(value, "ultima_atividade"),
    inactiveDays: typeof value.dias_sem_atividade === "number" ? value.dias_sem_atividade : 0,
    qualified: typeof value.qualificado === "boolean" ? value.qualificado : undefined,
    needsFollowup: typeof value.precisa_followup === "boolean" ? value.precisa_followup : undefined,
    coldLead: typeof value.lead_frio === "boolean" ? value.lead_frio : undefined,
  };
}

function normalizeInteraction(value: unknown): LeadInteraction {
  if (!isRecord(value)) throw new Error("Interação persistida possui formato inválido.");
  const id = readString(value, "id");
  const leadId = readString(value, "lead_id");
  const createdAt = readString(value, "criado_em");
  if (!id || !leadId || !createdAt) throw new Error("Interação persistida não possui campos obrigatórios.");
  return { id, leadId, createdAt, type: readString(value, "tipo"), note: readString(value, "nota"), nextStep: readOptionalString(value, "proximo_passo") };
}

async function responsePayload(response: Response) {
  const payload: unknown = await response.json();
  if (!response.ok) {
    const detail = isRecord(payload) ? readString(payload, "detail") : "";
    throw new Error(detail || `Erro HTTP no CRM: ${response.status}`);
  }
  if (!isRecord(payload)) throw new Error("Resposta inválida da API do CRM.");
  return payload;
}

export async function fetchCrmLeads(): Promise<Lead[]> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/crm/leads`, { headers: { Accept: "application/json" } });
  const payload = await responsePayload(response);
  if (payload.status !== "ok" || !Array.isArray(payload.leads)) throw new Error("Resposta de leads do CRM inválida.");
  return payload.leads.map(normalizeLead);
}

export async function fetchLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}/interactions`, { headers: { Accept: "application/json" } });
  const payload = await responsePayload(response);
  if (payload.status !== "ok" || !Array.isArray(payload.interacoes)) throw new Error("Resposta de interações do CRM inválida.");
  return payload.interacoes.map(normalizeInteraction);
}

export async function updateLeadStatus(leadId: string, status: LeadStage): Promise<Lead> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ status }) });
  const payload = await responsePayload(response);
  if (payload.status !== "ok") throw new Error("Resposta de atualização do lead inválida.");
  return normalizeLead(payload.lead);
}

export async function updateLead(leadId: string, input: CreateLeadInput): Promise<Lead> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ nome: input.name, whatsapp: input.whatsapp, ...(input.email ? { email: input.email } : {}), origem: input.source, objetivo: input.objective || null, valor_carta: input.amount ?? null, prazo_uso: input.usageDeadline || null, conhece_consorcio: input.knowsConsortium || null, observacoes: input.notes || null }) });
  const payload = await responsePayload(response);
  if (payload.status !== "ok") throw new Error("Resposta de edição do lead inválida.");
  return normalizeLead(payload.lead);
}

export async function deleteLead(leadId: string): Promise<void> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}`, { method: "DELETE", headers: { Accept: "application/json" } });
  const payload = await responsePayload(response);
  if (payload.status !== "ok") throw new Error("Resposta de exclusão do lead inválida.");
}

export async function createLeadInteraction(leadId: string, input: CreateInteractionInput): Promise<LeadInteraction> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}/interactions`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ tipo: "ligacao", nota: input.note, proximo_passo: input.nextStep || "" }) });
  const payload = await responsePayload(response);
  if (payload.status !== "ok") throw new Error("Resposta de criação da interação inválida.");
  return normalizeInteraction(payload.interacao);
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/leads/capture`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ nome: input.name, whatsapp: input.whatsapp, ...(input.email ? { email: input.email } : {}), origem: input.source || "outro", status: input.stage, objetivo: input.objective || null, valor_carta: input.amount ?? null, prazo_uso: input.usageDeadline || null, conhece_consorcio: input.knowsConsortium || null, observacoes: input.notes || null }) });
  const payload = await responsePayload(response);
  const leadId = readString(payload, "lead_id");
  if ((payload.status !== "criado" && payload.status !== "duplicado") || !leadId) throw new Error("Resposta de criação do lead inválida.");
  const leads = await fetchCrmLeads();
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Lead criado, mas não retornado na atualização do CRM.");
  return lead;
}
