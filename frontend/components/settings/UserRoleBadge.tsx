import type { UserRole } from "@/types/settings";

type UserRoleBadgeProps = {
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const roleClasses: Record<UserRole, string> = {
  admin: "border-[#6366F1]/20 bg-[#6366F1]/10 text-[#6366F1]",
  editor: "border-gray-200 bg-gray-100 text-[#0A0A0A]",
  viewer: "border-gray-200 bg-gray-50 text-[#717182]",
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleClasses[role]}`}
    >
      {roleLabels[role]}
    </span>
  );
}
