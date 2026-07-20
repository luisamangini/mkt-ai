import type { ContentItem, ContentPillar } from "@/types/content";

import { AiScore } from "./AiScore";
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
  return (
    <tr
      onClick={() => onSelect(item)}
      className={`cursor-pointer border-b border-black/5 transition-colors hover:bg-gray-50 ${
        selected ? "bg-gray-50" : "bg-white"
      }`}
    >
      <td className="min-w-[280px] px-5 py-4">
        <div className="font-mono text-[10px] leading-4 text-[#717182]">
          {item.id}
        </div>
        <div className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#0A0A0A]">
          {item.title}
        </div>
      </td>
      <td className="min-w-[120px] px-3 py-4">
        <ContentFormatBadge format={item.format} />
      </td>
      <td className="min-w-[150px] px-3 py-4 text-[11px] leading-4 text-[#717182]">
        {pillarLabel[item.pillar]}
      </td>
      <td className="min-w-[110px] px-3 py-4">
        <ContentStatusBadge status={item.status} />
      </td>
      <td className="min-w-[130px] px-3 py-4">
        <AiScore score={item.aiScore} />
      </td>
      <td className="min-w-[90px] px-3 py-4 text-[11px] leading-4 text-[#717182]">
        {item.createdAt}
      </td>
      <td className="min-w-[120px] px-5 py-4">
        <ContentStatusBadge approvalStatus={item.approvalStatus} />
      </td>
    </tr>
  );
}
