import type { ContentItem, ContentPillar } from "@/types/content";

import { ContentFormatBadge } from "./ContentFormatBadge";
import { ContentStatusBadge } from "./ContentStatusBadge";

type ContentRowProps = {
  item: ContentItem;
  selected: boolean;
  onSelect: (item: ContentItem) => void;
};

const pillarLabel: Record<ContentPillar, string> = {
  educacao_financeira: "Educação Financeira",
  prova_social: "Prova Social",
  mitos: "Mitos",
  atualidades: "Atualidades",
  conversao: "Conversão",
};

export function ContentRow({ item, selected, onSelect }: ContentRowProps) {
  const publication = item.scheduledDate
    ? new Date(`${item.scheduledDate}T00:00:00`)
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        .replace(" de ", " ")
        .replace(".", "") + (item.scheduledTime ? ` · ${item.scheduledTime}` : "")
    : "—";

  return (
    <tr
      onClick={() => onSelect(item)}
      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted ${
        selected ? "bg-muted" : "bg-card"
      }`}
    >
      <td className="min-w-[280px] px-5 py-4">
        <div className="line-clamp-2 text-[12px] font-medium leading-5 text-foreground">
          {item.title}
        </div>
      </td>
      <td className="min-w-[120px] px-3 py-4">
        <ContentFormatBadge format={item.format} />
      </td>
      <td className="min-w-[150px] px-3 py-4 text-[11px] leading-4 text-muted-foreground">
        {pillarLabel[item.pillar]}
      </td>
      <td className="min-w-[110px] px-3 py-4">
        <ContentStatusBadge status={item.status} />
      </td>
      <td className="min-w-[90px] px-3 py-4 text-[11px] leading-4 text-muted-foreground">
        {item.createdAt}
      </td>
      <td className="min-w-[130px] px-3 py-4 text-[11px] leading-4 text-muted-foreground">
        {publication}
      </td>
    </tr>
  );
}
