import type { ContentFormat, ContentOrigin, ContentPillar, ContentStatus } from "@/types/content";
import type { CalendarContentItem, ScheduleTarget } from "@/types/calendar";

const DEFAULT_API_URL = "http://localhost:8000";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] as string : "";
}

function normalizeFormat(value: string): ContentFormat {
  const normalized = value.toLowerCase();
  if (normalized === "reel" || normalized === "carrossel" || normalized === "stories") return normalized;
  throw new Error("Formato inválido no calendário.");
}

function normalizePillar(value: string): ContentPillar {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const pillars: Record<string, ContentPillar> = {
    "educacao financeira": "educacao_financeira",
    "prova social": "prova_social",
    "mitos e verdades": "mitos",
    "atualidades e mercado": "atualidades",
    conversao: "conversao",
  };
  const pillar = pillars[normalized];
  if (!pillar) throw new Error("Pilar inválido no calendário.");
  return pillar;
}

function normalizeStatus(value: string): ContentStatus {
  if (value === "aprovado" || value === "publicado" || value === "descartado") return value;
  return "sem_status";
}

function normalizeItem(value: unknown): CalendarContentItem {
  if (!isRecord(value)) throw new Error("Item inválido no calendário.");
  const roteiro = isRecord(value.roteiro) ? value.roteiro : {};
  const development = Array.isArray(roteiro.desenvolvimento)
    ? roteiro.desenvolvimento.filter((item): item is string => typeof item === "string")
    : [];
  const executionId = stringValue(value, "execution_id");
  const contentIndex = value.content_index;
  const date = stringValue(value, "scheduled_date");
  if (!executionId || typeof contentIndex !== "number" || !date) {
    throw new Error("Item do calendário sem identificadores ou data.");
  }
  return {
    id: `${executionId}:${contentIndex}`,
    executionId,
    contentIndex,
    title: stringValue(value, "titulo_interno"),
    date,
    time: stringValue(value, "scheduled_time") || undefined,
    format: normalizeFormat(stringValue(value, "formato")),
    pillar: normalizePillar(stringValue(value, "pilar")),
    status: normalizeStatus(stringValue(value, "status_editorial")),
    origin: (stringValue(value, "origin") === "manual" ? "manual" : "ai") as ContentOrigin,
    description: [stringValue(roteiro, "hook"), development[0]].filter(Boolean).join(" ") || undefined,
  };
}

async function parseItemResponse(response: Response) {
  if (!response.ok) throw new Error(`Erro HTTP ao salvar agendamento: ${response.status}`);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.status !== "ok") throw new Error("Resposta inválida ao salvar agendamento.");
  return normalizeItem(payload.conteudo);
}

export async function fetchCalendarItems(startDate: string, endDate: string) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const response = await fetch(`${apiUrl}/calendar?${params}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Erro HTTP ao buscar calendário: ${response.status}`);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.status !== "ok" || !Array.isArray(payload.items)) {
    throw new Error("Resposta da API de calendário possui formato inválido.");
  }
  return payload.items.map(normalizeItem);
}

export async function scheduleContent(target: ScheduleTarget, date: string, time?: string) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  return parseItemResponse(await fetch(
    `${apiUrl}/content/${encodeURIComponent(target.executionId)}/${target.contentIndex}/schedule`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ date, time: time || null }),
    },
  ));
}

export async function unscheduleContent(target: ScheduleTarget) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  const response = await fetch(
    `${apiUrl}/content/${encodeURIComponent(target.executionId)}/${target.contentIndex}/schedule`,
    { method: "DELETE", headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`Erro HTTP ao remover agendamento: ${response.status}`);
}
