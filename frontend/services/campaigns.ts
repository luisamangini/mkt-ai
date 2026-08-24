import type { CampaignsData, CampaignSnapshot, PersistedCampaign } from "@/types/campaigns";

const DEFAULT_API_URL = "http://localhost:8000";
const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] as string : "";
}

function number(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Métrica inválida no snapshot: ${key}.`);
  return value;
}

function normalizeCampaign(value: unknown): PersistedCampaign {
  if (!isRecord(value)) throw new Error("Campanha persistida possui formato inválido.");
  return { name: text(value, "nome"), investment: number(value, "gasto"), impressions: number(value, "impressoes"), clicks: number(value, "cliques"), ctr: number(value, "ctr"), cpm: number(value, "cpm"), leads: number(value, "leads"), cpl: number(value, "cpl") };
}

function normalizeSnapshot(value: unknown): CampaignSnapshot {
  if (!isRecord(value)) throw new Error("Snapshot de campanhas possui formato inválido.");
  const campaigns = value.campanhas;
  if (!Array.isArray(campaigns)) throw new Error("Campanhas do snapshot possuem formato inválido.");
  return {
    week: text(value, "semana"), generatedAt: text(value, "gerado_em"), requestedPeriod: text(value, "periodo_solicitado"), usedPeriod: text(value, "periodo_utilizado"), warning: text(value, "aviso") || undefined,
    investment: number(value, "gasto"), impressions: number(value, "impressoes"), reach: number(value, "alcance"), clicks: number(value, "cliques"), ctr: number(value, "ctr"), cpm: number(value, "cpm"), cpl: number(value, "cpl_bruto"), metaLeads: number(value, "leads_meta"), frequency: number(value, "frequencia"), hookRate: number(value, "hook_rate"),
    newLeads: number(value, "leads_novos"), qualifiedLeads: number(value, "leads_qualificados"), negotiatingLeads: number(value, "leads_em_negociacao"), closedLeads: number(value, "leads_fechados"), lostLeads: number(value, "leads_perdidos"), qualificationRate: number(value, "taxa_qualificacao"), closingRate: number(value, "taxa_fechamento"), qualifiedLeadCost: number(value, "custo_lead_qualificado"), closedLeadCost: number(value, "custo_lead_fechado"), campaigns: campaigns.map(normalizeCampaign),
  };
}

export async function fetchCampaignsData(): Promise<CampaignsData> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/campaigns`, { headers: { Accept: "application/json" } });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const detail = isRecord(payload) ? text(payload, "detail") : "";
    throw new Error(detail || `Erro HTTP ao buscar campanhas: ${response.status}`);
  }
  if (!isRecord(payload) || payload.status !== "ok" || !Array.isArray(payload.history) || !Array.isArray(payload.campaigns)) throw new Error("Resposta da API de campanhas possui formato inválido.");
  return { current: payload.current === null ? null : normalizeSnapshot(payload.current), previous: payload.previous === null ? null : normalizeSnapshot(payload.previous), history: payload.history.map(normalizeSnapshot), campaigns: payload.campaigns.map(normalizeCampaign) };
}
