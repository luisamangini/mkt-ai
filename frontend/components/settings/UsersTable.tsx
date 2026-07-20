import { MoreHorizontal, Plus } from "lucide-react";
import type { SettingsUser } from "@/types/settings";
import { StatusBadge } from "./StatusBadge";
import { UserRoleBadge } from "./UserRoleBadge";

type UsersTableProps = {
  users: SettingsUser[];
};

export function UsersTable({ users }: UsersTableProps) {
  return (
    <section className="rounded-[10px] border border-black/10 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
        <div>
          <h1 className="text-base font-semibold text-[#0A0A0A]">Usuários</h1>
          <p className="mt-1 text-[11px] text-[#717182]">
            Gerencie o acesso à plataforma.
          </p>
        </div>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md bg-[#030213] px-3 text-[11px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          Convidar Usuário
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-black/10 bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-[#717182]">
              <th className="px-5 py-3">Usuário</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Função</th>
              <th className="px-3 py-3">Último acesso</th>
              <th className="px-3 py-3">Status</th>
              <th className="w-20 px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-black/5 text-[11px] text-[#717182] last:border-b-0 hover:bg-gray-50/70"
              >
                <td className="px-5 py-4 text-xs font-medium text-[#0A0A0A]">
                  {user.name}
                </td>
                <td className="px-3 py-4">{user.email}</td>
                <td className="px-3 py-4">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-3 py-4">{user.lastAccess}</td>
                <td className="px-3 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    aria-label={`Opções de ${user.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#717182] hover:bg-gray-50 hover:text-[#0A0A0A]"
                  >
                    <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
