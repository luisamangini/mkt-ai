import { fetchCampaignsData } from "@/services/campaigns";
import type { DashboardData, InstagramSummary } from "@/types/dashboard";

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
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Métrica inválida do Instagram: ${key}.`);
  return value;
}

function normalizeInstagram(value: unknown): InstagramSummary | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error("Resumo do Instagram possui formato inválido.");
  return { username: text(value, "instagram_username") || undefined, followers: number(value, "instagram_seguidores"), posts: number(value, "instagram_posts"), reach: number(value, "instagram_alcance"), views: number(value, "instagram_visualizacoes"), profileVisits: number(value, "instagram_visitas_perfil") };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [snapshots, response] = await Promise.all([
    fetchCampaignsData(),
    fetch(`${getApiUrl().replace(/\/$/, "")}/dashboard`, {
      headers: { Accept: "application/json" },
    }),
  ]);
  const payload: unknown = await response.json();
  if (!response.ok) {
    const detail = isRecord(payload) ? text(payload, "detail") : "";
    throw new Error(detail || `Erro HTTP ao buscar o Dashboard: ${response.status}`);
  }
  if (!isRecord(payload) || payload.status !== "ok") throw new Error("Resposta da API do Dashboard possui formato inválido.");
  return {
    snapshots,
    instagram: snapshots.current ? normalizeInstagram(payload.instagram) : null,
  };
}
