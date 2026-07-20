export type CampaignPeriod =
  | "7d"
  | "30d"
  | "current_month"
  | "previous_month";

export type CampaignTrend = "up" | "down";

export type CampaignStatus = "ativa" | "pausada" | "encerrada";

export type CampaignChartMetric = "investment_leads" | "cpl" | "ctr";

export interface CampaignMetric {
  label: string;
  value: string;
  variation: string;
  variationLabel: string;
  trend: CampaignTrend;
  isPositive: boolean;
}

export interface CampaignPerformancePoint {
  date: string;
  investment: number;
  leads: number;
  cpl: number;
  ctr: number;
}

export interface CampaignStatusSummary {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "amber" | "gray";
}

export interface LeadStageCost {
  name: string;
  description: string;
  value: string;
  amount: number;
  badge: string;
}

export interface FunnelStage {
  name: string;
  quantity: number;
  percentage: number;
  previousConversion?: string;
  color: "blue" | "purple" | "orange" | "green" | "red";
  separated?: boolean;
}

export interface CampaignPerformanceRow {
  campaign: string;
  status: CampaignStatus;
  investment: string;
  impressions: string;
  clicks: string;
  ctr: string;
  leads: number;
  cpl: string;
}
