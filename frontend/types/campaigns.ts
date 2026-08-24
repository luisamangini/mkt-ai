export type CampaignChartMetric = "investment_leads" | "cpl" | "ctr";

export interface PersistedCampaign {
  name: string;
  investment: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  leads: number;
  cpl: number;
}

export interface CampaignSnapshot {
  week: string;
  generatedAt: string;
  requestedPeriod: string;
  usedPeriod: string;
  warning?: string;
  investment: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpl: number;
  metaLeads: number;
  frequency: number;
  hookRate: number;
  newLeads: number;
  qualifiedLeads: number;
  negotiatingLeads: number;
  closedLeads: number;
  lostLeads: number;
  qualificationRate: number;
  closingRate: number;
  qualifiedLeadCost: number;
  closedLeadCost: number;
  campaigns: PersistedCampaign[];
}

export interface CampaignsData {
  current: CampaignSnapshot | null;
  previous: CampaignSnapshot | null;
  history: CampaignSnapshot[];
  campaigns: PersistedCampaign[];
}

export interface CampaignMetric {
  label: string;
  value: string;
  variation: string;
  variationLabel: string;
  tone: "positive" | "negative" | "neutral";
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
  color: "blue" | "purple" | "orange" | "green" | "red";
  separated?: boolean;
}

export type CampaignPerformanceRow = PersistedCampaign;
