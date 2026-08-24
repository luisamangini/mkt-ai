"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

type InviteUserModalProps = {
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteUserModal({ onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("O e-mail é obrigatório.");
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onInvite(normalizedEmail);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar o convite.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-user-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[10px] bg-popover p-5 text-popover-foreground shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="invite-user-title" className="text-sm font-semibold">
            Convidar usuário
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            autoFocus
            autoComplete="email"
            placeholder="usuario@email.com"
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-[11px] font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:bg-muted"
          />
        </label>

        {error ? <p className="mt-3 text-[11px] text-red-500">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 rounded-md border border-border px-4 text-[11px] hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-9 rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Convidar"}
          </button>
        </div>
      </form>
    </div>
  );
}
