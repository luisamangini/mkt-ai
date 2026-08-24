"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { deleteCurrentAccount } from "@/services/settings";
import type { CurrentAccount } from "@/types/settings";
import { AppearanceSettings } from "./AppearanceSettings";

const emptyAccount: CurrentAccount = { email: "", name: "" };

export function MyAccount() {
  const router = useRouter();
  const [account, setAccount] = useState<CurrentAccount>(emptyAccount);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!active) return;
      if (error || !user) {
        setLoadError("Não foi possível carregar os dados da sua conta.");
      } else {
        const metadataName = user.user_metadata.name;
        setAccount({
          email: user.email ?? "",
          name: typeof metadataName === "string" ? metadataName : "",
        });
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingName(true);
    setNameMessage("");
    setNameError("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setNameError("Sua sessão expirou. Entre novamente para salvar as alterações.");
      setSavingName(false);
      return;
    }

    const normalizedName = account.name.trim();
    const { error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, name: normalizedName },
    });
    if (error) {
      setNameError("Não foi possível salvar seu nome. Tente novamente.");
    } else {
      setAccount((current) => ({ ...current, name: normalizedName }));
      window.dispatchEvent(new CustomEvent(
        "mkt-ai-user-name-updated",
        { detail: normalizedName },
      ));
      setNameMessage("Alterações salvas com sucesso.");
    }
    setSavingName(false);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    setRecoveryMessage("");
    setRecoveryError("");

    if (!currentPassword) {
      setPasswordError("Informe sua senha atual.");
      return;
    }

    setSavingPassword(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setPasswordError("Sua sessão expirou. Entre novamente para alterar a senha.");
        return;
      }

      const { error: authenticationError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (authenticationError) {
        setPasswordError("Senha atual incorreta.");
        return;
      }

      if (password.length < 6) {
        setPasswordError("A nova senha deve possuir pelo menos 6 caracteres.");
        return;
      }
      if (password !== passwordConfirmation) {
        setPasswordError("As senhas não coincidem.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordError("Não foi possível alterar sua senha. Tente novamente.");
      } else {
        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
        setPasswordMessage("Senha alterada com sucesso.");
      }
    } catch {
      setPasswordError("Não foi possível alterar sua senha. Tente novamente.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePasswordRecovery(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setRecoveryMessage("");
    setRecoveryError("");
    setSendingRecovery(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setRecoveryError("Sua sessão expirou. Entre novamente para redefinir a senha.");
        return;
      }

      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo,
      });
      if (error) {
        setRecoveryError("Não foi possível enviar o e-mail agora. Tente novamente.");
      } else {
        setRecoveryMessage("Enviamos um link para redefinir sua senha.");
      }
    } catch {
      setRecoveryError("Não foi possível enviar o e-mail agora. Tente novamente.");
    } finally {
      setSendingRecovery(false);
    }
  }

  async function handleDelete() {
    await deleteCurrentAccount();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return <div className="p-5 text-[11px] text-muted-foreground">Carregando sua conta...</div>;
  }
  if (loadError) {
    return <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-500">{loadError}</div>;
  }

  return (
    <div className="space-y-5">
      <AppearanceSettings />
      <section className="rounded-[10px] border border-border bg-card text-card-foreground">
        <header className="border-b border-border px-5 py-4">
          <h1 className="text-base font-semibold">Minha conta</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">Gerencie seus dados pessoais.</p>
        </header>
        <form onSubmit={handleNameSubmit} className="space-y-4 p-5">
          <AccountField label="Nome">
            <input value={account.name} onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value }))} className="account-field" />
          </AccountField>
          <AccountField label="E-mail">
            <input value={account.email} readOnly aria-readonly="true" className="account-field cursor-not-allowed bg-muted text-muted-foreground" />
          </AccountField>
          <Feedback success={nameMessage} error={nameError} />
          <button type="submit" disabled={savingName} className="h-9 rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground disabled:opacity-50">
            {savingName ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </section>

      <section className="rounded-[10px] border border-border bg-card text-card-foreground">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Alterar senha</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Defina uma nova senha para sua conta.</p>
        </header>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 p-5">
          <AccountField label="Senha atual"><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="account-field" /></AccountField>
          <AccountField label="Nova senha"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="account-field" /></AccountField>
          <AccountField label="Confirmar nova senha"><input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" className="account-field" /></AccountField>
          <p className="text-[11px] text-muted-foreground">Use pelo menos 6 caracteres.</p>
          <Feedback success={passwordMessage} error={passwordError} />
          <Feedback success={recoveryMessage} error={recoveryError} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={savingPassword} className="h-9 rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground disabled:opacity-50">
              {savingPassword ? "Salvando..." : "Alterar senha"}
            </button>
            <button type="button" onClick={(event) => void handlePasswordRecovery(event)} disabled={sendingRecovery} className="h-9 px-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
              {sendingRecovery ? "Enviando..." : "Esqueci minha senha"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[10px] border border-red-500/30 bg-card text-card-foreground">
        <header className="border-b border-red-100 px-5 py-4">
          <h2 className="text-base font-semibold text-red-700">Zona de perigo</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Esta ação é permanente e removerá seu acesso à plataforma.</p>
        </header>
        <div className="p-5"><button type="button" onClick={() => setDeleteOpen(true)} className="h-9 rounded-md border border-red-300 px-4 text-[11px] font-medium text-red-600 hover:bg-red-50">Excluir minha conta</button></div>
      </section>

      {deleteOpen ? <DeleteAccountModal onClose={() => setDeleteOpen(false)} onDelete={handleDelete} /> : null}
      <style jsx>{`.account-field { margin-top: 0.375rem; height: 2.5rem; width: 100%; border-radius: 0.375rem; border: 1px solid var(--input); background: var(--background); padding: 0 0.75rem; font-size: 0.75rem; color: var(--foreground); outline: none; } .account-field:focus { border-color: var(--ring); box-shadow: 0 0 0 2px color-mix(in oklch, var(--ring) 20%, transparent); }`}</style>
    </div>
  );
}

function AccountField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-[11px] font-medium text-foreground">{label}{children}</label>;
}

function Feedback({ success, error }: { success: string; error: string }) {
  if (error) return <p className="text-[11px] text-red-500" role="alert">{error}</p>;
  return success ? <p className="text-[11px] text-green-600" role="status">{success}</p> : null;
}

function DeleteAccountModal({ onClose, onDelete }: { onClose: () => void; onDelete: () => Promise<void> }) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    setDeleting(true);
    setError("");
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir sua conta.");
      setDeleting(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><div className="w-full max-w-md rounded-[10px] bg-popover p-5 text-popover-foreground shadow-xl"><div className="flex items-center justify-between"><h2 id="delete-account-title" className="text-sm font-semibold text-red-600 dark:text-red-400">Excluir minha conta</h2><button type="button" onClick={onClose} disabled={deleting} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"><X className="h-4 w-4" /></button></div><p className="mt-4 text-[11px] text-muted-foreground">Esta ação é permanente. Digite <strong className="text-foreground">EXCLUIR</strong> para confirmar.</p><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={deleting} autoFocus className="mt-3 h-9 w-full rounded-md border border-input bg-background px-3 text-[11px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />{error ? <p className="mt-3 text-[11px] text-red-500">{error}</p> : null}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={deleting} className="h-9 rounded-md border border-border px-4 text-[11px] hover:bg-muted disabled:opacity-50">Cancelar</button><button type="button" onClick={() => void confirmDelete()} disabled={deleting || confirmation !== "EXCLUIR"} className="h-9 rounded-md bg-red-600 px-4 text-[11px] font-medium text-white disabled:opacity-50">{deleting ? "Excluindo..." : "Excluir permanentemente"}</button></div></div></div>;
}
