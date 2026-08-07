import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { ResearchCategory, ResearchPeriod } from "@/types/research";

type ResearchFiltersProps = {
  period: ResearchPeriod;
  category: ResearchCategory;
  onPeriodChange: (period: ResearchPeriod) => void;
  onCategoryChange: (category: ResearchCategory) => void;
};

const periods: { value: ResearchPeriod; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "ultimas_24h", label: "Últimas 24h" },
  { value: "ultimos_7_dias", label: "Últimos 7 dias" },
  { value: "ultimos_30_dias", label: "Últimos 30 dias" },
];

const categories: { value: ResearchCategory; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "atualidades", label: "Atualidades" },
  { value: "mitos", label: "Mitos" },
  { value: "mercado", label: "Mercado" },
  { value: "economia", label: "Economia" },
  { value: "tendencias", label: "Tendências" },
];

export function ResearchFilters({
  period,
  category,
  onPeriodChange,
  onCategoryChange,
}: ResearchFiltersProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative shrink-0 overflow-hidden border-r border-black/10 bg-white transition-[width] duration-200 ease-out ${
        collapsed ? "w-12 p-2" : "w-[232px] p-4"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Expandir filtros" : "Recolher filtros"}
        title={collapsed ? "Expandir filtros" : "Recolher filtros"}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-[#717182] transition-colors hover:bg-gray-50 hover:text-[#0A0A0A]"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} />
        ) : (
          <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />
        )}
      </button>

      {!collapsed ? (
        <div>
          <FilterSection title="PERÍODO">
            {periods.map((item) => (
              <FilterButton
                key={item.value}
                label={item.label}
                selected={period === item.value}
                onClick={() => onPeriodChange(item.value)}
              />
            ))}
          </FilterSection>

          <div className="mt-6">
            <FilterSection title="CATEGORIA">
              {categories.map((item) => (
                <FilterButton
                  key={item.value}
                  label={item.label}
                  selected={category === item.value}
                  onClick={() => onCategoryChange(item.value)}
                />
              ))}
            </FilterSection>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function FilterButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-full items-center rounded-md px-2 text-left text-xs transition-colors ${
        selected
          ? "bg-gray-100 font-medium text-[#0A0A0A]"
          : "text-[#717182] hover:bg-gray-50 hover:text-[#0A0A0A]"
      }`}
    >
      {label}
    </button>
  );
}
