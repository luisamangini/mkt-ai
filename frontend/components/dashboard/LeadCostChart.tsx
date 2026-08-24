import type { DashboardLeadCost } from "@/types/dashboard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function LeadCostChart({ items }: { items: DashboardLeadCost[] }) {
  const maxCost = Math.max(...items.map((item) => item.amount), 0);
  const scale = Array.from({ length: 5 }, (_, index) => maxCost * index / 4);
  return <section className="overflow-hidden rounded-[10px] border border-border bg-card"><div className="border-b border-border px-5 py-3"><h2 className="text-xs font-semibold text-foreground">Custo por Estágio do Lead</h2></div><div className="space-y-7 px-5 py-5">{items.map((item) => { const ratio = maxCost > 0 ? item.amount / maxCost : 0; return <div key={item.badge} className="grid items-center gap-4 md:grid-cols-[160px_minmax(0,1fr)_140px]"><div className="md:text-right"><div className="text-[11px] font-semibold text-foreground">{item.title}</div><div className="mt-0.5 text-[9px] text-muted-foreground">{item.description}</div></div><div className="h-8 overflow-hidden rounded-lg bg-muted"><div className={`h-full rounded-lg opacity-85 ${item.colorClass}`} style={{ width: item.amount === 0 ? "0%" : `${Math.max(ratio * 100, 5)}%` }} /></div><div className="flex items-center gap-2"><span className={`font-mono text-xl font-bold ${item.valueClass}`}>{currency.format(item.amount)}</span><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.badgeClass}`}>{item.badge}</span></div></div>; })}<div className="grid grid-cols-5 pl-0 text-[9px] font-mono text-muted-foreground/50 md:pl-[176px] md:pr-[156px]">{scale.map((value, index) => <span key={index}>{currency.format(value)}</span>)}</div></div></section>;
}
