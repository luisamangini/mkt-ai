import type {
  CampaignMetric,
  CampaignPerformancePoint,
  CampaignPerformanceRow,
  CampaignStatusSummary,
  FunnelStage,
  LeadStageCost,
} from "@/types/campaigns";

export const campaignMetrics: CampaignMetric[] = [
  {
    label: "Investimento",
    value: "R$ 41,2 mil",
    variation: "+R$ 8,4 mil",
    variationLabel: "vs. período anterior",
    trend: "up",
    isPositive: true,
  },
  {
    label: "Leads gerados",
    value: "342",
    variation: "+18%",
    variationLabel: "vs. período anterior",
    trend: "up",
    isPositive: true,
  },
  {
    label: "CPL médio",
    value: "R$ 28,40",
    variation: "-R$ 4,20",
    variationLabel: "vs. período anterior",
    trend: "down",
    isPositive: true,
  },
  {
    label: "Taxa de conversão",
    value: "3,5%",
    variation: "+0,6 p.p.",
    variationLabel: "vs. período anterior",
    trend: "up",
    isPositive: true,
  },
];

export const campaignStatusSummary: CampaignStatusSummary[] = [
  { label: "campanhas no período", value: "4" },
  { label: "ativas", value: "2", tone: "green" },
  { label: "pausada", value: "1", tone: "amber" },
  { label: "encerrada", value: "1", tone: "gray" },
  { label: "leads qualificados", value: "89" },
  { label: "vendas", value: "12" },
];

export const campaignPerformancePoints: CampaignPerformancePoint[] = [
  { date: "01 Jul", investment: 3800, leads: 28, cpl: 135.71, ctr: 2.8 },
  { date: "05 Jul", investment: 4200, leads: 37, cpl: 113.51, ctr: 3.1 },
  { date: "09 Jul", investment: 5100, leads: 46, cpl: 110.87, ctr: 3.4 },
  { date: "13 Jul", investment: 4700, leads: 39, cpl: 120.51, ctr: 3.2 },
  { date: "17 Jul", investment: 5600, leads: 51, cpl: 109.8, ctr: 3.8 },
  { date: "21 Jul", investment: 5900, leads: 54, cpl: 109.26, ctr: 4 },
  { date: "25 Jul", investment: 6200, leads: 49, cpl: 126.53, ctr: 3.7 },
  { date: "30 Jul", investment: 5700, leads: 38, cpl: 150, ctr: 3.5 },
];

export const leadStageCosts: LeadStageCost[] = [
  {
    name: "Custo por Lead",
    description: "Todo contato captado nas campanhas",
    value: "R$ 28,40",
    amount: 28.4,
    badge: "CPL",
  },
  {
    name: "Custo por Lead Qualificado",
    description: "Lead classificado como oportunidade",
    value: "R$ 109,17",
    amount: 109.17,
    badge: "CPQL",
  },
  {
    name: "Custo por Negociação",
    description: "Lead que avançou para negociação",
    value: "R$ 226,60",
    amount: 226.6,
    badge: "CPN",
  },
  {
    name: "Custo por Venda",
    description: "Lead convertido em cliente",
    value: "R$ 811,67",
    amount: 811.67,
    badge: "CPA",
  },
];

export const funnelStages: FunnelStage[] = [
  {
    name: "Novo",
    quantity: 342,
    percentage: 100,
    color: "blue",
  },
  {
    name: "Qualificado",
    quantity: 89,
    percentage: 26,
    previousConversion: "26% conv.",
    color: "purple",
  },
  {
    name: "Em negociação",
    quantity: 43,
    percentage: 12.6,
    previousConversion: "48% conv.",
    color: "orange",
  },
  {
    name: "Fechado",
    quantity: 12,
    percentage: 3.5,
    previousConversion: "28% conv.",
    color: "green",
  },
  {
    name: "Perdido",
    quantity: 198,
    percentage: 57.9,
    color: "red",
    separated: true,
  },
];

export const campaignPerformanceRows: CampaignPerformanceRow[] = [
  {
    campaign: "Consórcio Imobiliário — Julho",
    status: "ativa",
    investment: "R$ 4.280,00",
    impressions: "118.400",
    clicks: "4.860",
    ctr: "4,1%",
    leads: 151,
    cpl: "R$ 28,34",
  },
  {
    campaign: "Consórcio de Veículos",
    status: "ativa",
    investment: "R$ 3.140,00",
    impressions: "92.700",
    clicks: "3.150",
    ctr: "3,4%",
    leads: 96,
    cpl: "R$ 32,71",
  },
  {
    campaign: "Construção de Patrimônio",
    status: "pausada",
    investment: "R$ 1.870,00",
    impressions: "64.500",
    clicks: "2.000",
    ctr: "3,1%",
    leads: 62,
    cpl: "R$ 30,16",
  },
  {
    campaign: "Lance Embutido",
    status: "encerrada",
    investment: "R$ 920,00",
    impressions: "31.800",
    clicks: "1.020",
    ctr: "3,2%",
    leads: 33,
    cpl: "R$ 27,88",
  },
];
