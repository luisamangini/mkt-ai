import { Check, Clock3 } from "lucide-react";

import type { ContentApprovalStatus, ContentStatus } from "@/types/content";

type ContentStatusBadgeProps = {
  status?: ContentStatus;
  approvalStatus?: ContentApprovalStatus;
};

const statusClass: Record<ContentStatus, string> = {
  rascunho: "border-gray-200 bg-gray-50 text-[#717182]",
  aprovacao: "border-amber-200 bg-amber-50 text-amber-700",
  publicado: "border-[#05DF72]/20 bg-[#05DF72]/10 text-green-600",
};

const statusLabel: Record<ContentStatus, string> = {
  rascunho: "Rascunho",
  aprovacao: "Aprovação",
  publicado: "Publicado",
};

export function ContentStatusBadge({
  status,
  approvalStatus,
}: ContentStatusBadgeProps) {
  if (approvalStatus) {
    if (approvalStatus === "nao_aplicavel") {
      return <span className="text-[11px] text-[#717182]">—</span>;
    }

    const approved = approvalStatus === "aprovado";
    const Icon = approved ? Check : Clock3;

    return (
      <span
        className={`inline-flex h-[24px] items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium leading-4 ${
          approved
            ? "border-[#05DF72]/20 bg-[#05DF72]/10 text-green-600"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        {approved ? "Aprovado" : "Pendente"}
      </span>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <span
      className={`inline-flex h-[24px] items-center rounded-md border px-2 text-[11px] font-medium leading-4 ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
