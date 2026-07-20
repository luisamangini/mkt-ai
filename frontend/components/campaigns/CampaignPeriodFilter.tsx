"use client";

import type { CampaignPeriod } from "@/types/campaigns";

type CampaignPeriodFilterProps = {
  selectedPeriod: CampaignPeriod;
  onPeriodChange: (period: CampaignPeriod) => void;
};

const periodOptions: Array<{ label: string; value: CampaignPeriod }> = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Este mês", value: "current_month" },
  { label: "Mês anterior", value: "previous_month" },
];

export function CampaignPeriodFilter({
  selectedPeriod,
  onPeriodChange,
}: CampaignPeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-base font-semibold text-[#0A0A0A]">Campanhas</h1>
        <p className="mt-1 text-[11px] text-[#717182]">
          Acompanhe investimento, eficiência e conversão das campanhas
        </p>
      </div>

      <div className="flex rounded-md border border-black/10 bg-white p-0.5">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPeriodChange(option.value)}
            className={`h-8 rounded px-3 text-[11px] font-medium transition-colors ${
              selectedPeriod === option.value
                ? "bg-gray-100 text-[#0A0A0A]"
                : "text-[#717182] hover:text-[#0A0A0A]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
