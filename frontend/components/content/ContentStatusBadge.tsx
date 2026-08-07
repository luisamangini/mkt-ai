import type { ContentStatus } from "@/types/content";

type ContentStatusBadgeProps = {
  status: ContentStatus;
};

const statusClass: Record<ContentStatus, string> = {
  sem_status: "border-gray-200 bg-gray-50 text-[#717182]",
  aprovado: "border-[#05DF72]/20 bg-[#05DF72]/10 text-green-600",
  publicado: "border-[#51A2FF]/20 bg-[#51A2FF]/10 text-[#2B7FFF]",
  descartado: "border-red-200 bg-red-50 text-red-500",
};

const statusLabel: Record<ContentStatus, string> = {
  sem_status: "Sem status",
  aprovado: "Aprovado",
  publicado: "Publicado",
  descartado: "Descartado",
};

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-[24px] items-center rounded-md border px-2 text-[11px] font-medium leading-4 ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
