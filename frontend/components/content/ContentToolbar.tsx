import { Plus } from "lucide-react";

import type { ContentFilter } from "@/types/content";

type ContentToolbarProps = {
  activeFilter: ContentFilter;
  counts: Record<ContentFilter, number>;
  onFilterChange: (filter: ContentFilter) => void;
  onNewContent: () => void;
};

const filters: { value: ContentFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aprovado", label: "Aprovado" },
  { value: "publicado", label: "Publicado" },
  { value: "descartado", label: "Descartado" },
];

export function ContentToolbar({
  activeFilter,
  counts,
  onFilterChange,
  onNewContent,
}: ContentToolbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex flex-wrap items-center gap-1">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={`h-8 rounded-md px-3 text-[11px] font-medium transition-colors ${
              activeFilter === filter.value
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {filter.label}
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              {counts[filter.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewContent}
          className="flex h-9 items-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          Novo Conteúdo
        </button>
      </div>
    </header>
  );
}
