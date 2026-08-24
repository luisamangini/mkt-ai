import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { ContentPeriod, ContentPillar, ContentPillarFilter } from "@/types/content";

type Props = {
  period: ContentPeriod;
  pillar: ContentPillarFilter;
  pillars: ContentPillar[];
  onPeriodChange: (period: ContentPeriod) => void;
  onPillarChange: (pillar: ContentPillarFilter) => void;
};

const periods: Array<{ value: ContentPeriod; label: string }> = [
  { value: "hoje", label: "Hoje" },
  { value: "ultimos_7_dias", label: "Últimos 7 dias" },
  { value: "ultimos_30_dias", label: "Últimos 30 dias" },
];

const pillarLabels: Record<ContentPillar, string> = {
  educacao_financeira: "Educação Financeira",
  prova_social: "Prova Social",
  mitos: "Mitos e Verdades",
  atualidades: "Atualidades e Mercado",
  conversao: "Conversão",
};

export function ContentFilters({ period, pillar, pillars, onPeriodChange, onPillarChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  return <aside className={`relative shrink-0 overflow-hidden border-r border-border bg-card transition-[width] duration-200 ease-out ${collapsed ? "w-12 p-2" : "w-[232px] p-4"}`}>
    <button type="button" onClick={() => setCollapsed((current) => !current)} aria-label={collapsed ? "Expandir filtros" : "Recolher filtros"} title={collapsed ? "Expandir filtros" : "Recolher filtros"} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {collapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />}
    </button>
    {!collapsed ? <div>
      <FilterSection title="PERÍODO">{periods.map((item) => <FilterButton key={item.value} label={item.label} selected={period === item.value} onClick={() => onPeriodChange(item.value)} />)}</FilterSection>
      <div className="mt-6"><FilterSection title="PILAR"><FilterButton label="Todos" selected={pillar === "todos"} onClick={() => onPillarChange("todos")} />{pillars.map((item) => <FilterButton key={item} label={pillarLabels[item]} selected={pillar === item} onClick={() => onPillarChange(item)} />)}</FilterSection></div>
    </div> : null}
  </aside>;
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="mb-2 px-2 text-[10px] font-semibold uppercase leading-3 tracking-wide text-muted-foreground">{title}</h2><div className="space-y-1">{children}</div></section>;
}

function FilterButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex h-8 w-full items-center rounded-md px-2 text-left text-xs transition-colors ${selected ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{label}</button>;
}
