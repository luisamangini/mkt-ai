import type { CampaignStatusSummary } from "@/types/campaigns";

type CampaignStatusStripProps = {
  items: CampaignStatusSummary[];
};

const toneClasses: Record<NonNullable<CampaignStatusSummary["tone"]>, string> = {
  neutral: "border-gray-200 bg-gray-50 text-[#717182]",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  gray: "border-gray-200 bg-gray-50 text-[#717182]",
};

export function CampaignStatusStrip({ items }: CampaignStatusStripProps) {
  return (
    <div className="rounded-[10px] border border-black/10 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.value}-${item.label}`}
            className={`flex items-center gap-2 ${
              index > 0 ? "border-l border-black/10 pl-4" : ""
            }`}
          >
            <span
              className={`inline-flex min-w-6 justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                toneClasses[item.tone ?? "neutral"]
              }`}
            >
              {item.value}
            </span>
            <span className="text-[11px] text-[#717182]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
