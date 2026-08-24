"use client";

import { useEffect, useMemo, useState } from "react";

import {
  deleteResearchExecution,
  fetchResearchInsights,
} from "@/services/research";
import type {
  ResearchCategory,
  ResearchInsight,
  ResearchPeriod,
} from "@/types/research";

import { ResearchCard } from "./ResearchCard";
import { ResearchDetailsPanel } from "./ResearchDetailsPanel";
import { ResearchFilters } from "./ResearchFilters";


export function ResearchPageContent() {
  const [period, setPeriod] = useState<ResearchPeriod>("hoje");
  const [category, setCategory] = useState<ResearchCategory>("todos");
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [generatedAtLabel, setGeneratedAtLabel] = useState(
    "sem execução no período",
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedInsight, setSelectedInsight] =
    useState<ResearchInsight | null>(null);

  useEffect(() => {
    let active = true;

    fetchResearchInsights(period)
      .then((result) => {
        if (!active) {
          return;
        }

        setInsights(result.insights);
        setGeneratedAtLabel(result.generatedAtLabel);
        setLoadError("");
        setSelectedInsight(null);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setInsights([]);
        setGeneratedAtLabel("indisponível");
        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as pesquisas.",
        );
        setSelectedInsight(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [period]);

  const filteredInsights = useMemo(() => {
    if (category === "todos") {
      return insights;
    }

    return insights.filter(
      (insight) => insight.category === category,
    );
  }, [category, insights]);

  async function handleDeleteExecution(executionId: string) {
    await deleteResearchExecution(executionId);
    setInsights((current) =>
      current.filter((insight) => insight.executionId !== executionId),
    );
    setSelectedInsight(null);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <ResearchFilters
        period={period}
        category={category}
        onPeriodChange={setPeriod}
        onCategoryChange={(nextCategory) => {
          setCategory(nextCategory);
          setSelectedInsight(null);
        }}
      />

      <section className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-semibold leading-5 text-foreground">
              {filteredInsights.length} resultados
            </div>
            <div className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {loading
                ? "Carregando dados da pesquisa..."
                : `Última execução: ${generatedAtLabel}`}
            </div>
          </div>
        </header>

        <div className="space-y-3 p-5">
          {loadError ? (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-4 text-red-700">
              {loadError}
            </div>
          ) : null}

          {loading ? (
            <>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-[10px] border border-border bg-card p-4"
                >
                  <div className="mb-3 h-4 w-28 rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="mt-3 h-3 w-full rounded bg-muted" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                </div>
              ))}
            </>
          ) : (
            filteredInsights.map((insight) => (
              <ResearchCard
                key={insight.id}
                insight={insight}
                selected={selectedInsight?.id === insight.id}
                onSelect={setSelectedInsight}
              />
            ))
          )}

          {!loading && filteredInsights.length === 0 ? (
            <div className="rounded-[10px] border border-border bg-card p-4 text-[11px] text-muted-foreground">
              Nenhum resultado encontrado para os filtros selecionados.
            </div>
          ) : null}
        </div>
      </section>

      {!loading && selectedInsight ? (
        <ResearchDetailsPanel
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
          onDeleteExecution={handleDeleteExecution}
        />
      ) : null}
    </div>
  );
}
