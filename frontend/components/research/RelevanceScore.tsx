import type { ResearchRelevance } from "@/types/research";

type RelevanceScoreProps = {
  score: number;
  relevance: ResearchRelevance;
  compact?: boolean;
};

function getRelevanceLabel(score: number) {
  if (score >= 85) {
    return "Muito relevante";
  }

  if (score >= 70) {
    return "Relevante";
  }

  return "Moderado";
}

const relevanceClass: Record<ResearchRelevance, string> = {
  alta: "bg-[#05DF72]",
  media: "bg-[#F59E0B]",
  baixa: "bg-[#717182]",
};

export function RelevanceScore({
  score,
  relevance,
  compact = false,
}: RelevanceScoreProps) {
  if (compact) {
    return (
      <div className="w-24">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold leading-3 text-[#0A0A0A]">
            {score}
          </span>
          <span className="text-[9px] leading-3 text-[#717182]">score</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${relevanceClass[relevance]}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl font-semibold leading-8 text-[#0A0A0A]">
            {score}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase leading-3 tracking-wide text-[#717182]">
            relevância
          </div>
        </div>
        <div className="pb-1 text-right text-[11px] font-medium leading-4 text-[#717182]">
          {getRelevanceLabel(score)}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${relevanceClass[relevance]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
