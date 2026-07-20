import { Check, Download, MessageSquareText, Pencil, X } from "lucide-react";
import type { ReactNode } from "react";

import type { ContentItem, ContentPillar } from "@/types/content";

import { ContentFormatBadge } from "./ContentFormatBadge";
import { ContentStatusBadge } from "./ContentStatusBadge";

type ContentDetailsPanelProps = {
  item: ContentItem;
  onClose: () => void;
};

const pillarLabel: Record<ContentPillar, string> = {
  educacao_financeira: "Educação Financeira",
  prova_social: "Prova Social",
  mitos: "Mitos",
  atualidades: "Atualidades",
  conversao: "Conversão",
};

export function ContentDetailsPanel({
  item,
  onClose,
}: ContentDetailsPanelProps) {
  const isCarousel = item.format === "carrossel";

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-black/10 bg-white">
      <div className="flex items-start justify-between border-b border-black/10 px-5 py-4">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-medium leading-4 text-[#717182]">
            {item.id}
          </div>
          <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#0A0A0A]">
            {item.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhe do conteúdo"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#717182] transition-colors hover:bg-gray-50 hover:text-[#0A0A0A]"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="flex flex-wrap gap-2">
          <ContentFormatBadge format={item.format} />
          <span className="inline-flex h-[24px] items-center rounded-md border border-black/10 bg-white px-2 text-[11px] font-medium leading-4 text-[#0A0A0A]">
            {pillarLabel[item.pillar]}
          </span>
        </div>

        <section className="grid grid-cols-3 gap-2">
          <InfoBadge label="Status">
            <ContentStatusBadge status={item.status} />
          </InfoBadge>
          <InfoBadge label="Aprovação">
            <ContentStatusBadge approvalStatus={item.approvalStatus} />
          </InfoBadge>
          <InfoBadge label="Compliance">
            <span className="text-[11px] font-medium leading-4 text-green-600">
              {item.complianceOk ? "OK" : "Revisar"}
            </span>
          </InfoBadge>
        </section>

        <DetailSection title="Título completo">
          <p>{item.title}</p>
        </DetailSection>

        <DetailSection title="Roteiro">
          <ScriptBlock title="Hook">{item.script.hook}</ScriptBlock>

          {isCarousel && item.script.slides ? (
            <div className="mt-3">
              <div className="mb-2 text-[10px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
                Slides
              </div>
              <ol className="space-y-2">
                {item.script.slides.map((slide, index) => (
                  <li
                    key={slide}
                    className="rounded-md border border-black/10 bg-gray-50 p-2 text-[11px] leading-5 text-[#717182]"
                  >
                    <span className="mr-2 font-mono text-[10px] text-[#0A0A0A]">
                      {index + 1}.
                    </span>
                    {slide}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="mt-3">
              <div className="mb-2 text-[10px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
                Desenvolvimento
              </div>
              <ul className="space-y-2">
                {item.script.development.map((line) => (
                  <li
                    key={line}
                    className="rounded-md border border-black/10 bg-gray-50 p-2 text-[11px] leading-5 text-[#717182]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ScriptBlock title="CTA">{item.script.cta}</ScriptBlock>
        </DetailSection>

        <DetailSection title="Hashtags">
          <div className="flex flex-wrap gap-1.5">
            {item.script.hashtags.map((hashtag) => (
              <span
                key={hashtag}
                className="rounded bg-gray-50 px-2 py-0.5 text-[10px] leading-4 text-[#717182]"
              >
                {hashtag}
              </span>
            ))}
          </div>
        </DetailSection>

        {item.sourceResearchTitle ? (
          <DetailSection title="Origem">
            <div className="rounded-[10px] border border-black/10 bg-gray-50 p-3">
              <div className="mb-1 text-[10px] font-medium uppercase leading-3 tracking-wide text-[#717182]">
                Gerado a partir de:
              </div>
              <p>{item.sourceResearchTitle}</p>
            </div>
          </DetailSection>
        ) : null}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Baixar
          </button>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-black/10 px-3 text-[11px] font-medium text-[#0A0A0A] hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
            Editar manualmente
          </button>

          {item.status === "aprovacao" ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#05DF72]/20 bg-[#05DF72]/10 px-2 text-[11px] font-medium text-green-600"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                Aprovar
              </button>
              <button
                type="button"
                className="flex h-9 items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 text-[11px] font-medium text-amber-700"
              >
                <MessageSquareText className="h-3.5 w-3.5" strokeWidth={1.8} />
                Solicitar ajustes
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function InfoBadge({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-2">
      <div className="mb-1 text-[9px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
        {label}
      </div>
      {children}
    </div>
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

function ScriptBlock({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div className="mt-3 rounded-md border border-black/10 bg-gray-50 p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase leading-3 tracking-wide text-[#717182]">
        {title}
      </div>
      <p className="text-[11px] leading-5 text-[#717182]">{children}</p>
    </div>
  );
}
