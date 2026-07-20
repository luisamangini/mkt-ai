"use client";

import { useState } from "react";
import {
  campaignMetrics,
  campaignPerformancePoints,
  campaignPerformanceRows,
  campaignStatusSummary,
  funnelStages,
  leadStageCosts,
} from "@/lib/mock-data/campaigns";
import type { CampaignPeriod } from "@/types/campaigns";
import { CampaignPeriodFilter } from "./CampaignPeriodFilter";
import { CampaignPerformanceChart } from "./CampaignPerformanceChart";
import { CampaignsPerformanceTable } from "./CampaignsPerformanceTable";
import { CampaignSummary } from "./CampaignSummary";
import { ConversionFunnel } from "./ConversionFunnel";
import { LeadStageCostCard } from "./LeadStageCostCard";

export function CampaignsPageContent() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<CampaignPeriod>("30d");

  return (
    <div className="min-w-0 space-y-5">
      <CampaignPeriodFilter
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      <CampaignSummary
        metrics={campaignMetrics}
        statusItems={campaignStatusSummary}
      />

      <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(320px,0.9fr)]">
        <CampaignPerformanceChart points={campaignPerformancePoints} />
        <ConversionFunnel stages={funnelStages} />
      </section>

      <LeadStageCostCard stages={leadStageCosts} />

      <CampaignsPerformanceTable rows={campaignPerformanceRows} />
    </div>
  );
}
