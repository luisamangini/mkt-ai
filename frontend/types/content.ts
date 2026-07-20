export type ContentFormat = "reel" | "carrossel" | "stories";

export type ContentPillar =
  | "educacao_financeira"
  | "prova_social"
  | "mitos"
  | "atualidades"
  | "conversao";

export type ContentStatus = "rascunho" | "aprovacao" | "publicado";

export type ContentApprovalStatus =
  | "pendente"
  | "aprovado"
  | "nao_aplicavel";

export type ContentFilter = "todos" | "rascunho" | "aprovacao" | "publicado";

export interface ContentScript {
  hook: string;
  development: string[];
  slides?: string[];
  cta: string;
  hashtags: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  format: ContentFormat;
  pillar: ContentPillar;
  status: ContentStatus;
  aiScore: number;
  createdAt: string;
  approvalStatus: ContentApprovalStatus;
  complianceOk: boolean;
  script: ContentScript;
  sourceResearchTitle?: string;
}
