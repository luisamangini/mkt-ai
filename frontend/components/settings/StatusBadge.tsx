import type { UserStatus } from "@/types/settings";

type StatusBadgeProps = {
  status: UserStatus;
};

const statusLabels: Record<UserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

const statusClasses: Record<UserStatus, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  inactive: "border-gray-200 bg-gray-50 text-[#717182]",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
