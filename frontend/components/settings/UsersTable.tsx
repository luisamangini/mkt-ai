"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { SettingsUser } from "@/types/settings";
import { InviteUserModal } from "./InviteUserModal";

type UsersTableProps = {
  users: SettingsUser[];
  loading: boolean;
  error: string;
  successMessage: string;
  onInvite: (email: string) => Promise<void>;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) return "Nunca acessou";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : dateFormatter.format(date);
}

export function UsersTable({
  users,
  loading,
  error,
  successMessage,
  onInvite,
}: UsersTableProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <section className="rounded-[10px] border border-border bg-card text-card-foreground">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h1 className="text-base font-semibold">Usuários</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Gerencie o acesso à plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          Convidar Usuário
        </button>
      </header>

      {successMessage ? (
        <p className="mx-5 mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">
          {successMessage}
        </p>
      ) : null}

      {loading ? (
        <div className="px-5 py-12 text-center text-[11px] text-muted-foreground">
          Carregando usuários...
        </div>
      ) : error ? (
        <div className="px-5 py-8">
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {error}
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhum usuário disponível.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Nome</th>
                <th className="px-3 py-3">E-mail</th>
                <th className="px-3 py-3">Cadastrado em</th>
                <th className="px-5 py-3">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border text-[11px] text-muted-foreground last:border-b-0 hover:bg-muted/60"
                >
                  <td className="px-5 py-4 text-xs font-medium text-foreground">
                    {user.name || "Nome não informado"}
                  </td>
                  <td className="px-3 py-4 text-xs text-foreground">
                    {user.email}
                  </td>
                  <td className="px-3 py-4">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">{formatDate(user.lastSignInAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>
      {inviteOpen ? (
        <InviteUserModal
          onClose={() => setInviteOpen(false)}
          onInvite={onInvite}
        />
      ) : null}
    </>
  );
}
