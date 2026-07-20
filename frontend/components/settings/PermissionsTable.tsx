import type { PermissionRow } from "@/types/settings";
import { PermissionCell } from "./PermissionCell";

type PermissionsTableProps = {
  rows: PermissionRow[];
};

export function PermissionsTable({ rows }: PermissionsTableProps) {
  return (
    <section className="rounded-[10px] border border-black/10 bg-white">
      <header className="border-b border-black/10 px-5 py-4">
        <h1 className="text-base font-semibold text-[#0A0A0A]">
          Permissões por Função
        </h1>
        <p className="mt-1 text-[11px] text-[#717182]">
          Controle o acesso de cada perfil às funcionalidades da plataforma.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-black/10 bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-[#717182]">
              <th className="px-5 py-3">Funcionalidade</th>
              <th className="px-3 py-3 text-center">Admin</th>
              <th className="px-3 py-3 text-center">Editor</th>
              <th className="px-5 py-3 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-black/5 text-[11px] text-[#717182] last:border-b-0 hover:bg-gray-50/70"
              >
                <td className="px-5 py-4 text-xs font-medium text-[#0A0A0A]">
                  {row.feature}
                </td>
                <td className="px-3 py-4 text-center">
                  <PermissionCell allowed={row.admin} />
                </td>
                <td className="px-3 py-4 text-center">
                  <PermissionCell allowed={row.editor} />
                </td>
                <td className="px-5 py-4 text-center">
                  <PermissionCell allowed={row.viewer} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
