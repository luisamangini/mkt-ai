import { Filter, Plus } from "lucide-react";

import type { ContentFilter } from "@/types/content";

type ContentToolbarProps = {
  activeFilter: ContentFilter;
  counts: Record<ContentFilter, number>;
  onFilterChange: (filter: ContentFilter) => void;
};

const filters: { value: ContentFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "aprovacao", label: "Aprovação" },
  { value: "publicado", label: "Publicado" },
];

export function ContentToolbar({
  activeFilter,
  counts,
  onFilterChange,
}: ContentToolbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
      <div className="flex flex-wrap items-center gap-1">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={`h-8 rounded-md px-3 text-[11px] font-medium transition-colors ${
              activeFilter === filter.value
                ? "bg-gray-100 text-[#0A0A0A]"
                : "text-[#717182] hover:bg-gray-50 hover:text-[#0A0A0A]"
            }`}
          >
            {filter.label}
            <span className="ml-1.5 text-[10px] text-[#717182]">
              {counts[filter.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-[11px] font-medium text-[#0A0A0A] hover:bg-gray-50"
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={1.8} />
          Filtrar
        </button>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          Novo Conteúdo
        </button>
      </div>
    </header>
  );
}
