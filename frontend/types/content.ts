export type ContentFormat = "reel" | "carrossel" | "stories";

export type ContentPillar =
  | "educacao_financeira"
  | "prova_social"
  | "mitos"
  | "atualidades"
  | "conversao";

export type ContentStatus =
  | "sem_status"
  | "aprovado"
  | "publicado"
  | "descartado";

export type ContentFilter = "todos" | Exclude<ContentStatus, "sem_status">;
export type ContentOrigin = "ai" | "manual";

export interface ContentScript {
  hook: string;
  development: string[];
  slides?: string[];
  cta: string;
  hashtags: string[];
}

export interface ContentItem {
  id: string;
  executionId: string;
  contentIndex: number;
  title: string;
  format: ContentFormat;
  pillar: ContentPillar;
  status: ContentStatus;
  createdAt: string;
  origin: ContentOrigin;
  script: ContentScript;
  sourceResearchTitle?: string;
}

export type ContentEditPayload = Pick<ContentItem, "title" | "script">;
