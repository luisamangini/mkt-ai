import type { DashboardFunnelStage } from "@/types/dashboard";

type Props = { stages: DashboardFunnelStage[]; closingRate: number; openLeads: number; periodLabel?: string };

function FunnelBar({ stage }: { stage: DashboardFunnelStage }) {
  const width = stage.value === 0 ? "0%" : `${Math.max(stage.percentage, 7)}%`;
  return <div><div className="mb-1 flex items-center justify-between"><span className={`text-[10px] font-semibold ${stage.textClass}`}>{stage.label}</span><span className="flex items-center gap-2"><span className="text-xs font-bold text-foreground">{stage.value}</span><span className="font-mono text-[9px] text-muted-foreground">{stage.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span></span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${stage.colorClass}`} style={{ width }} /></div></div>;
}

export function ConversionFunnel({ stages, closingRate, openLeads, periodLabel }: Props) {
  return <section className="rounded-[10px] border border-border bg-card p-4"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xs font-semibold text-foreground">Funil de Conversão</h2><p className="mt-1 text-[10px] text-muted-foreground">Distribuição atual por status</p></div>{periodLabel ? <span className="text-[10px] text-muted-foreground">{periodLabel}</span> : null}</div><div className="space-y-2">{stages.map((stage, index) => <div key={stage.label} className={index === stages.length - 1 ? "border-t border-border pt-3" : ""}><FunnelBar stage={stage} /></div>)}</div><div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-center"><div><div className="text-xl font-semibold text-foreground">{(closingRate * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div><div className="mt-1 text-[9px] text-muted-foreground">Taxa de fechamento</div></div><div><div className="text-xl font-semibold text-foreground">{openLeads}</div><div className="mt-1 text-[9px] text-muted-foreground">Leads em aberto</div></div></div></section>;
}
