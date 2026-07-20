import type { ContentItem } from "@/types/content";

import { ContentRow } from "./ContentRow";

type ContentTableProps = {
  items: ContentItem[];
  selectedItemId?: string;
  onSelectItem: (item: ContentItem) => void;
};

export function ContentTable({
  items,
  selectedItemId,
  onSelectItem,
}: ContentTableProps) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse">
        <thead>
          <tr className="border-b border-black/10 text-left text-[9px] font-semibold uppercase leading-[13.5px] tracking-[0.1em] text-[#717182]/70">
            <th className="px-5 py-3">ID / Título</th>
            <th className="px-3 py-3">Formato</th>
            <th className="px-3 py-3">Pilar</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Score IA</th>
            <th className="px-3 py-3">Criado</th>
            <th className="px-5 py-3">Aprovação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ContentRow
              key={item.id}
              item={item}
              selected={item.id === selectedItemId}
              onSelect={onSelectItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
