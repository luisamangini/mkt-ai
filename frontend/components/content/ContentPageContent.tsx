"use client";

import { useMemo, useState } from "react";

import type { ContentFilter, ContentItem } from "@/types/content";

import { ContentDetailsPanel } from "./ContentDetailsPanel";
import { ContentTable } from "./ContentTable";
import { ContentToolbar } from "./ContentToolbar";

const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    id: "C-047",
    title: "5 impactos da Selic para quem quer comprar um imóvel em 2026",
    format: "reel",
    pillar: "educacao_financeira",
    status: "aprovacao",
    aiScore: 87,
    createdAt: "02 Jul",
    approvalStatus: "pendente",
    complianceOk: true,
    sourceResearchTitle:
      "Banco Central mantém Selic em 10,5% — consórcios ganham atratividade frente ao crédito",
    script: {
      hook:
        "A Selic mudou — mas isso não significa que financiar ficou barato.",
      development: [
        "Explicar como a Selic influencia o crédito.",
        "Mostrar a diferença entre taxa básica e taxa do financiamento.",
        "Comparar previsibilidade do consórcio com custo do financiamento.",
        "Reforçar que consórcio não possui juros, mas possui taxa de administração.",
      ],
      cta:
        "Quer comparar financiamento e consórcio para o seu caso? Me chama no direct.",
      hashtags: [
        "#selic",
        "#consorcio",
        "#financiamento",
        "#educacaofinanceira",
      ],
    },
  },
  {
    id: "C-046",
    title: "A Selic caiu. Ainda vale financiar ou o consórcio ficou melhor?",
    format: "reel",
    pillar: "prova_social",
    status: "publicado",
    aiScore: 92,
    createdAt: "01 Jul",
    approvalStatus: "aprovado",
    complianceOk: true,
    script: {
      hook:
        "Todo mundo comemorou a Selic... mas isso significa que financiar ficou melhor?",
      development: [
        "Explicar rapidamente o que mudou na Selic.",
        "Mostrar que juros menores ajudam o financiamento.",
        "Explicar que o consórcio continua sem juros.",
        "Mostrar em quais situações cada opção faz mais sentido.",
      ],
      cta: "Você escolheria financiamento ou consórcio? Comenta aqui.",
      hashtags: ["#selic", "#consorcio", "#financiamento", "#imovel"],
    },
  },
  {
    id: "C-045",
    title: "Por que o consórcio cresceu 18% enquanto muita gente ainda financia?",
    format: "carrossel",
    pillar: "mitos",
    status: "publicado",
    aiScore: 88,
    createdAt: "30 Jun",
    approvalStatus: "aprovado",
    complianceOk: true,
    sourceResearchTitle:
      "Vendas de consórcios de imóveis crescem 18% no 1º semestre de 2025",
    script: {
      hook:
        "O consórcio cresceu 18%. Mas muita gente ainda nem entende por quê.",
      development: [
        "Crescimento do mercado de consórcios.",
        "Juros altos do financiamento.",
        "Planejamento sem entrada.",
        "Crescimento do segmento imobiliário.",
      ],
      slides: [
        "O consórcio cresceu 18%.",
        "Financiamento ficou mais caro.",
        "Mais pessoas estão planejando antes de comprar.",
        "O consórcio permite comprar sem entrada.",
        "A carta acompanha a valorização do bem.",
        "Quer entender como funciona? Me chama.",
      ],
      cta: "Salva este carrossel para comparar depois.",
      hashtags: ["#consorcio", "#mercadoimobiliario", "#educacaofinanceira"],
    },
  },
  {
    id: "C-044",
    title: "Os 4 motivos que fizeram o consórcio bater recorde este ano",
    format: "stories",
    pillar: "atualidades",
    status: "rascunho",
    aiScore: 74,
    createdAt: "30 Jun",
    approvalStatus: "nao_aplicavel",
    complianceOk: true,
    script: {
      hook: "Você sabe por que o consórcio bateu recorde?",
      development: [
        "Juros altos.",
        "Busca por planejamento.",
        "Crescimento imobiliário.",
        "Expansão para serviços.",
      ],
      cta:
        "Responde este story: você já pensou em fazer um consórcio?",
      hashtags: ["#consorcio", "#mercado", "#atualidades"],
    },
  },
  {
    id: "C-043",
    title: "O maior mito sobre consórcio ainda faz milhares perderem dinheiro",
    format: "carrossel",
    pillar: "educacao_financeira",
    status: "aprovacao",
    aiScore: 81,
    createdAt: "29 Jun",
    approvalStatus: "pendente",
    complianceOk: true,
    script: {
      hook:
        "O maior mito sobre consórcio pode estar atrasando seu patrimônio.",
      development: [
        "Explicar que contemplação não é prometida.",
        "Diferenciar sorteio e lance.",
        "Explicar taxa de administração.",
        "Comparar planejamento com imediatismo.",
      ],
      slides: [
        "O maior mito do consórcio.",
        "Contemplação não é garantida.",
        "Existem sorteio e lance.",
        "Taxa de administração não é juros.",
        "Consórcio funciona melhor para quem planeja.",
        "Quer saber se faz sentido para você?",
      ],
      cta: "Comenta MITO e eu te explico.",
      hashtags: ["#mitos", "#consorcio", "#planejamentofinanceiro"],
    },
  },
  {
    id: "C-042",
    title:
      "SUVs lideram o consórcio: será que agora é a melhor hora para comprar?",
    format: "reel",
    pillar: "conversao",
    status: "publicado",
    aiScore: 79,
    createdAt: "28 Jun",
    approvalStatus: "aprovado",
    complianceOk: true,
    script: {
      hook:
        "SUVs estão puxando o crescimento do consórcio de veículos.",
      development: [
        "Crescimento das adesões.",
        "Procura por SUVs e pickups.",
        "Planejamento para compra de veículos.",
        "Diferença entre financiamento e consórcio.",
      ],
      cta: "Quer uma simulação para seu próximo carro? Me chama.",
      hashtags: ["#suv", "#consorcioauto", "#carro", "#cartadecredito"],
    },
  },
];

const filters: ContentFilter[] = [
  "todos",
  "rascunho",
  "aprovacao",
  "publicado",
];

export function ContentPageContent() {
  const [activeFilter, setActiveFilter] = useState<ContentFilter>("todos");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );

  const counts = useMemo(() => {
    return filters.reduce<Record<ContentFilter, number>>(
      (accumulator, filter) => {
        accumulator[filter] =
          filter === "todos"
            ? MOCK_CONTENT_ITEMS.length
            : MOCK_CONTENT_ITEMS.filter((item) => item.status === filter)
                .length;
        return accumulator;
      },
      {
        todos: 0,
        rascunho: 0,
        aprovacao: 0,
        publicado: 0,
      },
    );
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "todos") {
      return MOCK_CONTENT_ITEMS;
    }

    return MOCK_CONTENT_ITEMS.filter((item) => item.status === activeFilter);
  }, [activeFilter]);

  return (
    <div className="flex min-h-[calc(100vh-96px)] min-w-0 flex-1 overflow-hidden">
      <section className="min-w-0 flex-1 overflow-y-auto">
        <ContentToolbar
          activeFilter={activeFilter}
          counts={counts}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setSelectedContent(null);
          }}
        />
        <ContentTable
          items={filteredItems}
          selectedItemId={selectedContent?.id}
          onSelectItem={setSelectedContent}
        />
      </section>

      {selectedContent ? (
        <ContentDetailsPanel
          item={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      ) : null}
    </div>
  );
}
