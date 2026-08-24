import type {
  ResearchCategory,
  ResearchInsight,
  ResearchPeriod,
  ResearchRelevance,
  ResearchSource,
} from "@/types/research";

const DEFAULT_API_URL = "http://localhost:8000";

type ResearchApiTheme = {
  titulo: string;
  resumo?: string;
  angulo_sugerido?: string;
  pilar_sugerido?: string;
  relevancia?: string;
  fontes?: { titulo?: string; title?: string; url?: string }[];
};

type ResearchApiResponse = {
  status?: string;
  execution_id?: string;
  data?: string;
  gerado_em?: string;
  temas?: number | ResearchApiTheme[];
  temas_lista?: string[];
  temas_detalhados?: ResearchApiTheme[];
};

export type FetchResearchResult = {
  insights: ResearchInsight[];
  generatedAtLabel: string;
};

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeResearchSource(value: unknown): ResearchSource | null {
  if (!isRecord(value) || typeof value.url !== "string") {
    return null;
  }

  const title = asString(value.titulo) || asString(value.title);
  return title ? { title, url: value.url } : null;
}

function normalizeCategory(pillar: string): Exclude<ResearchCategory, "todos"> {
  const normalized = pillar
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("mitos")) {
    return "mitos";
  }

  if (normalized.includes("mercado") || normalized.includes("atualidades")) {
    return "atualidades";
  }

  if (normalized.includes("educacao") || normalized.includes("financeira")) {
    return "economia";
  }

  if (normalized.includes("conversao")) {
    return "tendencias";
  }

  return "mercado";
}

function normalizeRelevance(relevance: string): ResearchRelevance {
  if (relevance === "media" || relevance === "baixa") {
    return relevance;
  }

  return "alta";
}

function getRelevanceScore(relevance: ResearchRelevance, index: number) {
  if (relevance === "alta") {
    return Math.max(88 - index * 3, 80);
  }

  if (relevance === "media") {
    return Math.max(72 - index * 3, 60);
  }

  return Math.max(48 - index * 3, 35);
}

function formatGeneratedAt(value?: string) {
  if (!value) {
    return "agora";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExecutionDate(value?: string) {
  if (!value) {
    return "data indisponível";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const dateLabel = date
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(" de ", " ")
    .replace(" de ", " ");
  const timeLabel = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateLabel} · ${timeLabel}`;
}

function normalizeTheme(
  theme: ResearchApiTheme,
  index: number,
  generatedAtLabel: string,
  executionDateLabel = generatedAtLabel,
  executionId?: string,
): ResearchInsight {
  const title = theme.titulo.trim();
  const pillar = theme.pilar_sugerido || "Atualidades e Mercado";
  const relevance = normalizeRelevance(theme.relevancia || "alta");
  const sources = Array.isArray(theme.fontes)
    ? theme.fontes
        .map(normalizeResearchSource)
        .filter((source): source is ResearchSource => source !== null)
    : [];

  return {
    id: `REAL-${String(index + 1).padStart(3, "0")}`,
    executionId,
    title,
    summary:
      theme.resumo ||
      "Tema retornado pelo Research Agent para avaliação editorial.",
    rawContent:
      theme.resumo ||
      "O endpoint retornou este tema como oportunidade de conteúdo para a operação.",
    suggestedAngle:
      theme.angulo_sugerido ||
      "Transformar o tema em conteúdo educativo conectado ao momento do mercado.",
    pillar,
    relevance,
    relevanceScore: getRelevanceScore(relevance, index),
    category: normalizeCategory(pillar),
    sourceName: sources[0]?.title || "Research Agent",
    publishedAgo: executionDateLabel,
    tags: ["#Pesquisa", "#ConsorIA", `#${pillar.split(" ")[0]}`],
    sources:
      sources.length > 0
        ? sources
        : [{ title: "Resultado gerado pelo Research Agent", url: "#" }],
    generatedAt: generatedAtLabel,
  };
}

function normalizeCompactTitle(
  title: string,
  index: number,
  generatedAtLabel: string,
  executionId?: string,
): ResearchInsight {
  return normalizeTheme(
    {
      titulo: title,
      resumo:
        "O backend retornou este título como tema relevante da execução do Research Agent.",
      angulo_sugerido:
        "Avaliar o tema e transformar em pauta para Reel, Carrossel ou Stories.",
      pilar_sugerido: "Atualidades e Mercado",
      relevancia: "alta",
      fontes: [{ title: "Research Agent", url: "#" }],
    },
    index,
    generatedAtLabel,
    generatedAtLabel,
    executionId,
  );
}

function parseResearchApiResponse(payload: unknown): FetchResearchResult {
  if (!isRecord(payload)) {
    throw new Error("Resposta da API de pesquisa não é um objeto.");
  }

  if (Array.isArray(payload.pesquisas)) {
    const batches = payload.pesquisas
      .filter(isRecord)
      .map(parseResearchApiResponse);

    if (!batches.length) {
      return {
        insights: [],
        generatedAtLabel: "sem execução no período",
      };
    }

    return {
      insights: batches.flatMap((batch, batchIndex) =>
        batch.insights.map((insight, insightIndex) => ({
          ...insight,
          id: `REAL-${batchIndex + 1}-${insightIndex + 1}`,
        })),
      ),
      generatedAtLabel: batches[0].generatedAtLabel,
    };
  }

  const response: ResearchApiResponse = {
    status: asString(payload.status),
    execution_id: asString(payload.execution_id),
    data: asString(payload.data),
    gerado_em: asString(payload.gerado_em),
    temas: payload.temas as ResearchApiResponse["temas"],
    temas_detalhados: Array.isArray(payload.temas_detalhados)
      ? (payload.temas_detalhados as ResearchApiTheme[])
      : undefined,
    temas_lista: Array.isArray(payload.temas_lista)
      ? payload.temas_lista.filter((item): item is string => typeof item === "string")
      : undefined,
  };

  if (response.status && response.status !== "ok") {
    throw new Error("API de pesquisa retornou status diferente de ok.");
  }

  const generatedAtLabel = formatGeneratedAt(response.gerado_em || response.data);
  const executionDateLabel = formatExecutionDate(
    response.gerado_em || response.data,
  );

  const detailedThemes = response.temas_detalhados || response.temas;

  if (Array.isArray(detailedThemes)) {
    const themes = detailedThemes
      .filter(isRecord)
      .map((theme) => ({
        titulo: asString(theme.titulo),
        resumo: asString(theme.resumo),
        angulo_sugerido: asString(theme.angulo_sugerido),
        pilar_sugerido: asString(theme.pilar_sugerido),
        relevancia: asString(theme.relevancia),
        fontes: Array.isArray(theme.fontes)
          ? theme.fontes
          : [],
      }))
      .filter((theme) => theme.titulo);

    if (!themes.length) {
      throw new Error("Resposta completa da API não possui temas válidos.");
    }

    return {
      insights: themes.map((theme, index) =>
        normalizeTheme(
          theme,
          index,
          generatedAtLabel,
          executionDateLabel,
          response.execution_id,
        ),
      ),
      generatedAtLabel,
    };
  }

  if (response.temas_lista?.length) {
    return {
      insights: response.temas_lista.map((title, index) =>
        normalizeCompactTitle(
          title,
          index,
          generatedAtLabel,
          response.execution_id,
        ),
      ),
      generatedAtLabel,
    };
  }

  throw new Error("Resposta da API não possui temas em formato reconhecido.");
}

export async function fetchResearchInsights(
  period: ResearchPeriod,
): Promise<FetchResearchResult> {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ periodo: period });
  const response = await fetch(`${apiUrl}/research?${params}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ao buscar pesquisa: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return parseResearchApiResponse(payload);
}

export async function deleteResearchExecution(executionId: string) {
  const apiUrl = getApiUrl().replace(/\/$/, "");
  const response = await fetch(
    `${apiUrl}/research/execution/${encodeURIComponent(executionId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(`Erro HTTP ao apagar execução: ${response.status}`);
  }
}
