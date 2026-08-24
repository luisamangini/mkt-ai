import type { CampaignsData } from "@/types/campaigns";

export interface InstagramSummary {
  username?: string;
  followers: number;
  posts: number;
  reach: number;
  views: number;
  profileVisits: number;
}

export interface DashboardData {
  snapshots: CampaignsData;
  instagram: InstagramSummary | null;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  deltaContext: string;
  tone: "positive" | "negative" | "neutral";
}

export interface DashboardFunnelStage {
  label: string;
  value: number;
  percentage: number;
  colorClass: string;
  textClass: string;
}

export interface DashboardLeadCost {
  title: string;
  description: string;
  amount: number;
  badge: string;
  colorClass: string;
  valueClass: string;
  badgeClass: string;
}

export interface DashboardHistoryPoint {
  week: string;
  metaLeads: number;
  closedLeads: number;
}
