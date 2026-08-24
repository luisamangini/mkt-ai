"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCampaignsData } from "@/services/campaigns";
import type { CampaignMetric, CampaignsData, FunnelStage, LeadStageCost } from "@/types/campaigns";
import { CampaignPeriodFilter } from "./CampaignPeriodFilter";
import { CampaignPerformanceChart } from "./CampaignPerformanceChart";
import { CampaignsPerformanceTable } from "./CampaignsPerformanceTable";
import { CampaignSummary } from "./CampaignSummary";
import { ConversionFunnel } from "./ConversionFunnel";
import { LeadStageCostCard } from "./LeadStageCostCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function signedCurrency(value: number) {
  return `${value > 0 ? "+" : ""}${currency.format(value)}`;
}

export function CampaignsPageContent() {
  const [data, setData] = useState<CampaignsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchCampaignsData().then((result) => { if (active) { setData(result); setError(""); } }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as campanhas."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const view = useMemo(() => {
    if (!data?.current) return null;
    const current = data.current;
    const previous = data.previous;
    const metric = (label: string, value: string, variation: string, tone: CampaignMetric["tone"]): CampaignMetric => ({ label, value, variation, variationLabel: previous ? "vs. snapshot anterior" : "sem snapshot anterior", tone });
    const investmentDelta = previous ? current.investment - previous.investment : 0;
    const leadsDelta = previous ? current.metaLeads - previous.metaLeads : 0;
    const cplDelta = previous ? current.cpl - previous.cpl : 0;
    const closingDelta = previous ? (current.closingRate - previous.closingRate) * 100 : 0;
    const metrics: CampaignMetric[] = [
      metric("Investimento", currency.format(current.investment), previous ? signedCurrency(investmentDelta) : "—", "neutral"),
      metric("Leads gerados", integer.format(current.metaLeads), previous ? `${leadsDelta > 0 ? "+" : ""}${integer.format(leadsDelta)}` : "—", previous ? leadsDelta >= 0 ? "positive" : "negative" : "neutral"),
      metric("CPL médio", currency.format(current.cpl), previous ? signedCurrency(cplDelta) : "—", previous ? cplDelta <= 0 ? "positive" : "negative" : "neutral"),
      metric("Taxa de conversão", `${percent.format(current.closingRate * 100)}%`, previous ? `${closingDelta > 0 ? "+" : ""}${percent.format(closingDelta)} p.p.` : "—", previous ? closingDelta >= 0 ? "positive" : "negative" : "neutral"),
    ];
    const statusItems = [
      { label: "campanhas no período", value: integer.format(current.campaigns.length) },
      { label: "leads Meta", value: integer.format(current.metaLeads) },
      { label: "leads qualificados", value: integer.format(current.qualifiedLeads) },
      { label: "em negociação", value: integer.format(current.negotiatingLeads) },
      { label: "vendas", value: integer.format(current.closedLeads), tone: "green" as const },
    ];
    const totalLeads = current.newLeads + current.qualifiedLeads + current.negotiatingLeads + current.closedLeads + current.lostLeads;
    const share = (quantity: number) => totalLeads > 0 ? (quantity / totalLeads) * 100 : 0;
    const funnel: FunnelStage[] = [
      { name: "Novo", quantity: current.newLeads, percentage: share(current.newLeads), color: "blue" },
      { name: "Qualificado", quantity: current.qualifiedLeads, percentage: share(current.qualifiedLeads), color: "purple" },
      { name: "Em negociação", quantity: current.negotiatingLeads, percentage: share(current.negotiatingLeads), color: "orange" },
      { name: "Fechado", quantity: current.closedLeads, percentage: share(current.closedLeads), color: "green" },
      { name: "Perdido", quantity: current.lostLeads, percentage: share(current.lostLeads), color: "red", separated: true },
    ];
    const costs: LeadStageCost[] = [
      { name: "Custo por Lead", description: "CPL bruto persistido", value: currency.format(current.cpl), amount: current.cpl, badge: "CPL" },
      { name: "Custo por Lead Qualificado", description: "Custo persistido no snapshot", value: currency.format(current.qualifiedLeadCost), amount: current.qualifiedLeadCost, badge: "CPQL" },
      { name: "Custo por Venda", description: "Custo persistido no snapshot", value: currency.format(current.closedLeadCost), amount: current.closedLeadCost, badge: "CPA" },
    ];
    const points = data.history.map((snapshot) => ({ date: snapshot.week, investment: snapshot.investment, leads: snapshot.metaLeads, cpl: snapshot.cpl, ctr: snapshot.ctr }));
    return { current, metrics, statusItems, funnel, costs, points };
  }, [data]);

  if (loading) return <div className="p-5 text-[11px] text-muted-foreground">Carregando campanhas...</div>;
  if (error) return <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-500">{error}</div>;
  if (!data?.current || !view) return <div className="p-5 text-[11px] text-muted-foreground">Nenhum snapshot de campanhas disponível.</div>;

  return <div className="min-w-0 space-y-5">
    <CampaignPeriodFilter requestedPeriod={view.current.requestedPeriod} usedPeriod={view.current.usedPeriod} generatedAt={view.current.generatedAt} />
    {view.current.warning ? <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">{view.current.warning}</div> : null}
    <CampaignSummary metrics={view.metrics} statusItems={view.statusItems} />
    <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(320px,0.9fr)]"><CampaignPerformanceChart points={view.points} /><ConversionFunnel stages={view.funnel} periodLabel={view.current.usedPeriod} /></section>
    <LeadStageCostCard stages={view.costs} />
    <CampaignsPerformanceTable rows={data.campaigns} />
  </div>;
}
