import type { DashboardHistoryPoint } from "@/types/dashboard";

export function ExecutiveHistory({ points }: { points: DashboardHistoryPoint[] }) {
  const visible = points.slice(-8);
  const maxLeads = Math.max(...visible.map((point) => point.metaLeads), 1);
  const maxClosed = Math.max(...visible.map((point) => point.closedLeads), 1);
  return <section className="rounded-[10px] border border-border bg-card"><div className="border-b border-border px-5 py-3"><h2 className="text-xs font-semibold text-foreground">Evolução executiva</h2><p className="mt-1 text-[10px] text-muted-foreground">Cada linha representa um snapshot persistido</p></div>{visible.length ? <div className="space-y-3 p-5">{visible.map((point) => <div key={point.week} className="grid items-center gap-3 text-[10px] sm:grid-cols-[90px_1fr_1fr]"><span className="font-medium text-foreground">{point.week}</span><HistoryBar label="Leads Meta" value={point.metaLeads} width={point.metaLeads / maxLeads * 100} color="bg-[#51A2FF]" /><HistoryBar label="Fechados" value={point.closedLeads} width={point.closedLeads / maxClosed * 100} color="bg-[#22C55E]" /></div>)}</div> : <p className="p-5 text-[11px] text-muted-foreground">Nenhum histórico de snapshots disponível.</p>}{visible.length === 1 ? <p className="border-t border-border px-5 py-3 text-[10px] text-muted-foreground">A evolução será comparável quando houver mais snapshots.</p> : null}</section>;
}

function HistoryBar({ label, value, width, color }: { label: string; value: number; width: number; color: string }) { return <div><div className="mb-1 flex justify-between text-muted-foreground"><span>{label}</span><span>{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: value === 0 ? "0%" : `${Math.max(width, 4)}%` }} /></div></div>; }
