export type ResearchPeriod =
  | "hoje"
  | "ultimas_24h"
  | "ultimos_7_dias"
  | "ultimos_30_dias";

export type ResearchCategory =
  | "todos"
  | "atualidades"
  | "mitos"
  | "mercado"
  | "economia"
  | "tendencias";

export type ResearchRelevance = "alta" | "media" | "baixa";

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchInsight {
  id: string;
  title: string;
  summary: string;
  rawContent: string;
  suggestedAngle: string;
  pillar: string;
  relevance: ResearchRelevance;
  relevanceScore: number;
  category: Exclude<ResearchCategory, "todos">;
  sourceName: string;
  publishedAgo: string;
  tags: string[];
  sources: ResearchSource[];
  generatedAt: string;
}
