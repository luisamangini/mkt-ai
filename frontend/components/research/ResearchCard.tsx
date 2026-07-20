import type { ResearchCategory, ResearchInsight } from "@/types/research";

import { RelevanceScore } from "./RelevanceScore";

type ResearchCardProps = {
  insight: ResearchInsight;
  selected: boolean;
  onSelect: (insight: ResearchInsight) => void;
};

const categoryClass: Record<Exclude<ResearchCategory, "todos">, string> = {
  atualidades: "border-[#51A2FF]/20 bg-[#51A2FF]/10 text-[#2B7FFF]",
  mitos: "border-amber-200 bg-amber-50 text-amber-700",
  mercado: "border-[#05DF72]/20 bg-[#05DF72]/10 text-green-600",
  economia: "border-[#8E51FF]/20 bg-[#8E51FF]/10 text-[#8E51FF]",
  tendencias: "border-red-200 bg-red-50 text-red-500",
};

const categoryLabel: Record<Exclude<ResearchCategory, "todos">, string> = {
  atualidades: "Atualidades",
  mitos: "Mitos",
  mercado: "Mercado",
  economia: "Economia",
  tendencias: "Tendências",
};

export function ResearchCard({
  insight,
  selected,
  onSelect,
}: ResearchCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(insight)}
      className={`w-full cursor-pointer rounded-[10px] border bg-white p-4 text-left transition-colors hover:border-black/20 ${
        selected ? "border-[#0A0A0A]" : "border-black/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-medium leading-4 ${categoryClass[insight.category]}`}
            >
              {categoryLabel[insight.category]}
            </span>
            <span className="text-[10px] leading-4 text-[#717182]">
              {insight.sourceName}
            </span>
            <span className="text-[10px] leading-4 text-[#717182]">·</span>
            <span className="text-[10px] leading-4 text-[#717182]">
              {insight.publishedAgo}
            </span>
          </div>

          <h2 className="text-sm font-semibold leading-5 text-[#0A0A0A]">
            {insight.title}
          </h2>
          <p className="mt-2 text-[11px] leading-5 text-[#717182]">
            {insight.summary}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {insight.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-50 px-2 py-0.5 text-[10px] leading-4 text-[#717182]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <RelevanceScore
          score={insight.relevanceScore}
          relevance={insight.relevance}
          compact
        />
      </div>
    </button>
  );
}
