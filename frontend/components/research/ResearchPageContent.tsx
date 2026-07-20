"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";

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
  const [selectedInsight, setSelectedInsight] =
    useState<ResearchInsight | null>(null);

  const filteredInsights = useMemo(() => {
    if (category === "todos") {
      return MOCK_RESEARCH_INSIGHTS;
    }

    return MOCK_RESEARCH_INSIGHTS.filter(
      (insight) => insight.category === category,
    );
  }, [category]);

  return (
    <div className="flex min-h-[calc(100vh-96px)] min-w-0 flex-1 overflow-hidden">
      <ResearchFilters
        period={period}
        category={category}
        onPeriodChange={setPeriod}
        onCategoryChange={(nextCategory) => {
          setCategory(nextCategory);
          setSelectedInsight(null);
        }}
      />

      <section className="min-w-0 flex-1 overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold leading-5 text-[#0A0A0A]">
              {filteredInsights.length} resultados
            </div>
            <div className="mt-1 text-[11px] leading-4 text-[#717182]">
              Última execução: hoje às 16:00
            </div>
          </div>

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-[11px] font-medium text-[#0A0A0A] hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Exportar
          </button>
        </header>

        <div className="space-y-3 p-5">
          {filteredInsights.map((insight) => (
            <ResearchCard
              key={insight.id}
              insight={insight}
              selected={selectedInsight?.id === insight.id}
              onSelect={setSelectedInsight}
            />
          ))}
        </div>
      </section>

      {selectedInsight ? (
        <ResearchDetailsPanel
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
      ) : null}
    </div>
  );
}
