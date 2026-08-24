import type {
  ContentEditPayload,
  ContentFormat,
  ContentItem,
  ContentOrigin,
  ContentPillar,
  ContentStatus,
} from "@/types/content";
import { scheduleContent, unscheduleContent } from "@/services/calendar";

const DEFAULT_API_URL = "http://localhost:8000";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function normalizeFormat(value: string): ContentFormat {
  const normalized = value.toLowerCase();
  if (normalized === "reel" || normalized === "carrossel" || normalized === "stories") {
    return normalized;
  }
  throw new Error(`Formato de conteúdo inválido: ${value || "vazio"}.`);
}

function normalizePillar(value: string): ContentPillar {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "educacao financeira") return "educacao_financeira";
  if (normalized === "prova social") return "prova_social";
  if (normalized === "mitos e verdades") return "mitos";
  if (normalized === "atualidades e mercado") return "atualidades";
  if (normalized === "conversao") return "conversao";
  throw new Error(`Pilar de conteúdo inválido: ${value || "vazio"}.`);
}

function normalizeStatus(value: string): ContentStatus {
  if (
    value === "sem_status" ||
    value === "aprovado" ||
    value === "publicado" ||
    value === "descartado"
  ) {
    return value;
  }
  return "sem_status";
}

function normalizeOrigin(value: string): ContentOrigin {
  return value === "manual" ? "manual" : "ai";
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de geração do conteúdo inválida.");
  }

  const formatted = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  return formatted.replace(" de ", " ").replace(".", "");
}

function normalizeContent(value: unknown): ContentItem {
  if (!isRecord(value) || !isRecord(value.roteiro)) {
    throw new Error("Conteúdo persistido possui formato inválido.");
  }

  const id = readString(value, "id");
  const title = readString(value, "titulo_interno");
  const generatedAt = readString(value, "gerado_em");
  const executionId = readString(value, "execution_id");
  const contentIndex = value.content_index;
  if (!id || !title || !generatedAt || !executionId || typeof contentIndex !== "number") {
    throw new Error("Conteúdo persistido não possui campos obrigatórios.");
  }

  const development = Array.isArray(value.roteiro.desenvolvimento)
    ? value.roteiro.desenvolvimento.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const slides = Array.isArray(value.roteiro.slides)
    ? value.roteiro.slides
        .filter(isRecord)
        .map((slide) => ({
          order: typeof slide.ordem === "number" ? slide.ordem : 0,
          text: readString(slide, "texto"),
        }))
        .filter((slide) => slide.text)
        .sort((a, b) => a.order - b.order)
        .map((slide) => slide.text)
    : undefined;
  const hashtags = Array.isArray(value.hashtags)
    ? value.hashtags
        .filter((item): item is string => typeof item === "string")
        .map((item) => `#${item.replace(/^#+/, "").trim()}`)
        .filter((item) => item !== "#")
    : [];

  return {
    id,
    executionId,
    contentIndex,
    title,
    format: normalizeFormat(readString(value, "formato")),
    pillar: normalizePillar(readString(value, "pilar")),
    status: normalizeStatus(readString(value, "status_editorial")),
    createdAt: formatCreatedAt(generatedAt),
    generatedAt,
    origin: normalizeOrigin(readString(value, "origin")),
    scheduledDate: readString(value, "scheduled_date") || undefined,
    scheduledTime: readString(value, "scheduled_time") || undefined,
    script: {
      hook: readString(value.roteiro, "hook"),
      development,
      slides,
      cta: readString(value.roteiro, "cta"),
      hashtags,
    },
  };
}

async function parseContentResponse(response: Response): Promise<ContentItem> {
  if (!response.ok) {
    throw new Error(`Erro HTTP ao atualizar conteúdo: ${response.status}`);
  }
  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.status !== "ok") {
    throw new Error("Resposta de atualização do conteúdo é inválida.");
  }
  return normalizeContent(payload.conteudo);
}

export async function fetchContentItems(): Promise<ContentItem[]> {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  const response = await fetch(`${apiUrl}/content?periodo=ultimos_30_dias`, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ao buscar conteúdos: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.status !== "ok" || !Array.isArray(payload.conteudos)) {
    throw new Error("Resposta da API de conteúdos possui formato inválido.");
  }

  return payload.conteudos.map(normalizeContent);
}

export async function updateContentStatus(
  item: ContentItem,
  status: ContentStatus,
) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  return parseContentResponse(
    await fetch(
      `${apiUrl}/content/${encodeURIComponent(item.executionId)}/${item.contentIndex}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status }),
      },
    ),
  );
}

export async function updateContentItem(
  item: ContentItem,
  changes: ContentEditPayload,
) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  return parseContentResponse(
    await fetch(
      `${apiUrl}/content/${encodeURIComponent(item.executionId)}/${item.contentIndex}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          titulo: changes.title,
          hook: changes.script.hook,
          desenvolvimento: changes.script.development,
          slides: changes.script.slides,
          cta: changes.script.cta,
          hashtags: changes.script.hashtags,
        }),
      },
    ),
  );
}

export async function deleteContentItem(item: ContentItem) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  const response = await fetch(
    `${apiUrl}/content/${encodeURIComponent(item.executionId)}/${item.contentIndex}`,
    { method: "DELETE", headers: { Accept: "application/json" } },
  );
  if (!response.ok) {
    throw new Error(`Erro HTTP ao excluir conteúdo: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.status !== "ok" || !Array.isArray(payload.conteudos)) {
    throw new Error("Resposta de exclusão do conteúdo é inválida.");
  }
  return payload.conteudos.map(normalizeContent);
}

export async function scheduleContentItem(
  item: ContentItem,
  date: string,
  time?: string,
): Promise<ContentItem> {
  const scheduled = await scheduleContent(item, date, time);
  return {
    ...item,
    scheduledDate: scheduled.date,
    scheduledTime: scheduled.time,
  };
}

export async function unscheduleContentItem(
  item: ContentItem,
): Promise<ContentItem> {
  await unscheduleContent(item);
  return {
    ...item,
    scheduledDate: undefined,
    scheduledTime: undefined,
  };
}
