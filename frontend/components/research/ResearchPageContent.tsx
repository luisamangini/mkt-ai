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

const MOCK_RESEARCH_INSIGHTS: ResearchInsight[] = [
  {
    id: "R-001",
    title:
      "Banco Central mantém Selic em 10,5% — consórcios ganham atratividade frente ao crédito",
    summary:
      "Com juros estáveis, especialistas apontam o consórcio como alternativa mais econômica ao financiamento tradicional.",
    rawContent:
      "A Selic foi mantida em 10,5% ao ano. Com crédito bancário ainda pressionado por juros elevados, o financiamento tradicional segue caro para imóveis e veículos. O consórcio ganha força por não ter juros, operando com taxa de administração definida em contrato e maior previsibilidade de planejamento.",
    suggestedAngle:
      "Reel explicando por que estabilidade da Selic não significa financiamento barato.",
    pillar: "Atualidades e Mercado",
    relevance: "alta",
    relevanceScore: 94,
    category: "atualidades",
    sourceName: "Valor Econômico",
    publishedAgo: "há 2h",
    tags: ["#Selic", "#Oportunidade", "#Taxa de Juros"],
    sources: [
      {
        title: "Valor Econômico — decisão do Banco Central sobre a Selic",
        url: "#",
      },
    ],
    generatedAt: "hoje às 16:00",
  },
  {
    id: "R-002",
    title:
      "Vendas de consórcios de imóveis crescem 18% no 1º semestre de 2025",
    summary:
      "A ABAC divulga dados positivos para o setor, com imóveis liderando o crescimento.",
    rawContent:
      "O segmento de imóveis registrou crescimento de 18% no primeiro semestre de 2025. O volume de crédito comercializado avançou com a demanda de famílias que buscam planejamento de médio prazo e alternativas ao financiamento com juros altos.",
    suggestedAngle:
      "Carrossel mostrando por que mais brasileiros estão usando consórcio para imóveis.",
    pillar: "Atualidades e Mercado",
    relevance: "alta",
    relevanceScore: 89,
    category: "mercado",
    sourceName: "ABAC",
    publishedAgo: "há 5h",
    tags: ["#ABAC", "#Crescimento", "#Imóvel"],
    sources: [
      {
        title: "ABAC — balanço do mercado de consórcios imobiliários",
        url: "#",
      },
    ],
    generatedAt: "hoje às 16:00",
  },
  {
    id: "R-003",
    title: "5 mitos sobre consórcio que os brasileiros ainda acreditam em 2025",
    summary:
      "Matéria desmistifica crenças sobre contemplação, custos e funcionamento do consórcio.",
    rawContent:
      "Entre os mitos recorrentes estão: consórcio tem juros, lance garante contemplação e apenas os últimos participantes recebem a carta. Na prática, o consórcio não possui juros, a contemplação ocorre por sorteio ou lance e todos os participantes ativos são contemplados ao longo do grupo.",
    suggestedAngle: "Carrossel “5 mitos do consórcio desmentidos”.",
    pillar: "Mitos e Verdades",
    relevance: "alta",
    relevanceScore: 82,
    category: "mitos",
    sourceName: "InfoMoney",
    publishedAgo: "há 8h",
    tags: ["#Mitos", "#Educação", "#Viralidade"],
    sources: [
      {
        title: "InfoMoney — mitos e verdades sobre consórcio",
        url: "#",
      },
    ],
    generatedAt: "hoje às 16:00",
  },
  {
    id: "R-004",
    title:
      "Consórcio de veículos atinge recorde histórico em junho — SUVs lideram",
    summary:
      "O setor registra o maior volume de adesões desde 2019, puxado por SUVs e pickups.",
    rawContent:
      "O consórcio de veículos alcançou recorde histórico de adesões em junho, o maior volume desde 2019. SUVs e pickups lideram o avanço, refletindo consumidores que buscam trocar de carro com previsibilidade e menor dependência de financiamento.",
    suggestedAngle:
      "Reel sobre por que SUVs estão impulsionando o consórcio de veículos.",
    pillar: "Atualidades e Mercado",
    relevance: "media",
    relevanceScore: 71,
    category: "tendencias",
    sourceName: "Autoesporte",
    publishedAgo: "há 12h",
    tags: ["#Veículos", "#Recorde", "#Auto"],
    sources: [
      {
        title: "Autoesporte — consórcio de veículos bate recorde",
        url: "#",
      },
    ],
    generatedAt: "hoje às 16:00",
  },
];

export function ResearchPageContent() {
  const [period, setPeriod] = useState<ResearchPeriod>("hoje");
  const [category, setCategory] = useState<ResearchCategory>("todos");
  const [insights, setInsights] = useState<ResearchInsight[]>(
    MOCK_RESEARCH_INSIGHTS,
  );
  const [generatedAtLabel, setGeneratedAtLabel] = useState("hoje às 16:00");
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedInsight, setSelectedInsight] =
    useState<ResearchInsight | null>(null);

  useEffect(() => {
    let active = true;

    fetchResearchInsights()
      .then((result) => {
        if (!active) {
          return;
        }

        setInsights(result.insights);
        setGeneratedAtLabel(result.generatedAtLabel);
        setUsingFallback(false);
        setSelectedInsight(null);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setInsights(MOCK_RESEARCH_INSIGHTS);
        setGeneratedAtLabel("hoje às 16:00");
        setUsingFallback(true);
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
  }, []);

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
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold leading-5 text-[#0A0A0A]">
              {filteredInsights.length} resultados
            </div>
            <div className="mt-1 text-[11px] leading-4 text-[#717182]">
              {loading
                ? "Carregando dados da pesquisa..."
                : `Última execução: ${generatedAtLabel}`}
            </div>
          </div>
        </header>

        <div className="space-y-3 p-5">
          {usingFallback ? (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
              Não foi possível carregar os dados reais. Exibindo dados de
              demonstração.
            </div>
          ) : null}

          {loading ? (
            <>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-[10px] border border-black/10 bg-white p-4"
                >
                  <div className="mb-3 h-4 w-28 rounded bg-gray-100" />
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                  <div className="mt-3 h-3 w-full rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
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
            <div className="rounded-[10px] border border-black/10 bg-white p-4 text-[11px] text-[#717182]">
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
