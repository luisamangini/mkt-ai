import { Copy, ExternalLink, FileText, X } from "lucide-react";
import type { ReactNode } from "react";

import type { ResearchInsight } from "@/types/research";

import { RelevanceScore } from "./RelevanceScore";

type ResearchDetailsPanelProps = {
  insight: ResearchInsight;
  onClose: () => void;
};

export function ResearchDetailsPanel({
  insight,
  onClose,
}: ResearchDetailsPanelProps) {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-black/10 bg-white">
      <div className="flex items-start justify-between border-b border-black/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold leading-5 text-[#0A0A0A]">
            {insight.category}
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-[#717182]">
            {insight.sourceName} · {insight.publishedAgo}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhe da pesquisa"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#717182] transition-colors hover:bg-gray-50 hover:text-[#0A0A0A]"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <RelevanceScore
          score={insight.relevanceScore}
          relevance={insight.relevance}
        />

        <DetailSection title="Resumo">
          <p>{insight.summary}</p>
        </DetailSection>

        <DetailSection title="Por que foi selecionado">
          <p>
            Insight com relevância {insight.relevance} porque conecta um fato
            recente ao comportamento de compra do público de consórcio e oferece
            um gancho claro para conteúdo educativo ou de conversão.
          </p>
        </DetailSection>

        <DetailSection title="Dados concretos">
          <p>{insight.rawContent}</p>
        </DetailSection>

        <DetailSection title="Ângulo sugerido">
          <div className="rounded-[10px] border border-black/10 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold leading-4 text-[#0A0A0A]">
              <FileText className="h-4 w-4" strokeWidth={1.8} />
              Conteúdo
            </div>
            <p>{insight.suggestedAngle}</p>
          </div>
        </DetailSection>

        <DetailSection title="Pilar sugerido">
          <span className="inline-flex rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] font-medium leading-4 text-[#0A0A0A]">
            {insight.pillar}
          </span>
        </DetailSection>

        <DetailSection title="Fontes">
          <div className="space-y-2">
            {insight.sources.map((source) => (
              <a
                key={source.title}
                href={source.url}
                target={source.url === "#" ? undefined : "_blank"}
                rel={source.url === "#" ? undefined : "noreferrer"}
                className="flex items-center justify-between gap-3 rounded-md border border-black/10 px-3 py-2 text-[11px] leading-4 text-[#0A0A0A] hover:bg-gray-50"
              >
                <span className="truncate">{source.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#717182]" />
              </a>
            ))}
          </div>
        </DetailSection>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            className="h-9 w-full rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
          >
            Gerar conteúdo
          </button>
          <button
            type="button"
            className="h-9 w-full rounded-md border border-black/10 px-3 text-[11px] font-medium text-[#0A0A0A] hover:bg-gray-50"
          >
            Ignorar
          </button>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md px-3 text-[11px] font-medium text-[#717182] hover:bg-gray-50"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
            Copiar resumo
          </button>
        </div>
      </div>
    </aside>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
        {title}
      </h3>
      <div className="text-[11px] leading-5 text-[#717182]">{children}</div>
    </section>
  );
}
