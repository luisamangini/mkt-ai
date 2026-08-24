"use client";

import { useEffect, useMemo, useState } from "react";
import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import { ExecutiveHistory } from "@/components/dashboard/ExecutiveHistory";
import { FollowersReachCard } from "@/components/dashboard/FollowersReachCard";
import { LeadCostChart } from "@/components/dashboard/LeadCostChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fetchDashboardData } from "@/services/dashboard";
import type { DashboardData, DashboardFunnelStage, DashboardLeadCost, DashboardMetric } from "@/types/dashboard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchDashboardData().then((result) => { if (active) { setData(result); setError(""); } }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o Dashboard."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const view = useMemo(() => {
    if (!data?.snapshots.current) return null;
    const current = data.snapshots.current;
    const previous = data.snapshots.previous;
    const context = previous ? "vs. snapshot anterior" : "sem snapshot anterior";
    const absolute = (value: number) => `${value > 0 ? "+" : ""}${integer.format(value)}`;
    const money = (value: number) => `${value > 0 ? "+" : ""}${currency.format(value)}`;
    const tone = (value: number, lowerIsBetter = false): DashboardMetric["tone"] => !previous ? "neutral" : lowerIsBetter ? value <= 0 ? "positive" : "negative" : value >= 0 ? "positive" : "negative";
    const leadsDelta = previous ? current.metaLeads - previous.metaLeads : 0;
    const qualifiedDelta = previous ? current.qualifiedLeads - previous.qualifiedLeads : 0;
    const closedDelta = previous ? current.closedLeads - previous.closedLeads : 0;
    const investmentDelta = previous ? current.investment - previous.investment : 0;
    const cplDelta = previous ? current.cpl - previous.cpl : 0;
    const closingDelta = previous ? (current.closingRate - previous.closingRate) * 100 : 0;
    const metrics: DashboardMetric[] = [
      { label: "Leads Meta", value: integer.format(current.metaLeads), delta: previous ? absolute(leadsDelta) : "—", deltaContext: context, tone: tone(leadsDelta) },
      { label: "Qualificados", value: integer.format(current.qualifiedLeads), delta: previous ? absolute(qualifiedDelta) : "—", deltaContext: context, tone: tone(qualifiedDelta) },
      { label: "Fechados", value: integer.format(current.closedLeads), delta: previous ? absolute(closedDelta) : "—", deltaContext: context, tone: tone(closedDelta) },
      { label: "Investimento", value: currency.format(current.investment), delta: previous ? money(investmentDelta) : "—", deltaContext: context, tone: "neutral" },
      { label: "CPL", value: currency.format(current.cpl), delta: previous ? money(cplDelta) : "—", deltaContext: context, tone: tone(cplDelta, true) },
      { label: "Taxa de fechamento", value: `${percent.format(current.closingRate * 100)}%`, delta: previous ? `${closingDelta > 0 ? "+" : ""}${percent.format(closingDelta)} p.p.` : "—", deltaContext: context, tone: tone(closingDelta) },
    ];
    const total = current.newLeads + current.qualifiedLeads + current.negotiatingLeads + current.closedLeads + current.lostLeads;
    const share = (value: number) => total > 0 ? value / total * 100 : 0;
    const stages: DashboardFunnelStage[] = [
      { label: "Novo", value: current.newLeads, percentage: share(current.newLeads), colorClass: "bg-[#2B7FFF]/20", textClass: "text-[#2B7FFF]" },
      { label: "Qualificado", value: current.qualifiedLeads, percentage: share(current.qualifiedLeads), colorClass: "bg-[#8E51FF]/20", textClass: "text-[#8E51FF]" },
      { label: "Em Negociação", value: current.negotiatingLeads, percentage: share(current.negotiatingLeads), colorClass: "bg-[#F59E0B]/20", textClass: "text-[#F59E0B]" },
      { label: "Fechado", value: current.closedLeads, percentage: share(current.closedLeads), colorClass: "bg-[#05DF72]/20", textClass: "text-green-600" },
      { label: "Perdido", value: current.lostLeads, percentage: share(current.lostLeads), colorClass: "bg-red-400/10", textClass: "text-red-400" },
    ];
    const costs: DashboardLeadCost[] = [
      { title: "Custo por Lead", description: "CPL bruto persistido", amount: current.cpl, badge: "CPL", colorClass: "bg-[#22C55E]", valueClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15 text-[#22C55E]" },
      { title: "Custo por Lead Qualificado", description: "Custo persistido no snapshot", amount: current.qualifiedLeadCost, badge: "CPLQ", colorClass: "bg-[#F59E0B]", valueClass: "text-[#F59E0B]", badgeClass: "bg-[#F59E0B]/15 text-[#F59E0B]" },
      { title: "Custo por Lead Fechado", description: "Custo persistido no snapshot", amount: current.closedLeadCost, badge: "CPLF", colorClass: "bg-[#6366F1]", valueClass: "text-[#6366F1]", badgeClass: "bg-[#6366F1]/15 text-[#6366F1]" },
    ];
    const history = data.snapshots.history.map((snapshot) => ({ week: snapshot.week, metaLeads: snapshot.metaLeads, closedLeads: snapshot.closedLeads }));
    return { current, metrics, stages, costs, history, openLeads: current.newLeads + current.qualifiedLeads + current.negotiatingLeads };
  }, [data]);

  if (loading) return <div className="p-5 text-[11px] text-muted-foreground">Carregando Dashboard...</div>;
  if (error) return <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-500">{error}</div>;
  if (!view) return <div className="p-5 text-[11px] text-muted-foreground">Nenhum snapshot disponível para o Dashboard.</div>;

  const updated = new Date(view.current.generatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  return <div className="min-w-0 space-y-5"><div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>Visão executiva de marketing</span><span>Atualizado em {updated} · período {view.current.usedPeriod}</span></div>{view.current.warning ? <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">{view.current.warning}</div> : null}<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{view.metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section><section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]"><ExecutiveHistory points={view.history} /><FollowersReachCard instagram={data?.instagram ?? null} /></section><section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]"><LeadCostChart items={view.costs} /><ConversionFunnel stages={view.stages} closingRate={view.current.closingRate} openLeads={view.openLeads} periodLabel={view.current.usedPeriod} /></section></div>;
}
