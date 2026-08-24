"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type PasswordErrors = {
  password?: string;
  confirmation?: string;
};

export type PasswordMode = "invite" | "recovery";

type SetPasswordFormProps = {
  mode: PasswordMode;
};

export function SetPasswordForm({ mode }: SetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;

      setHasValidSession(Boolean(user));
      setIsCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      setHasValidSession(Boolean(session));
      setIsCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function validateForm() {
    const nextErrors: PasswordErrors = {};

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    } else if (password.length < 8) {
      nextErrors.password = "A senha deve possuir pelo menos 8 caracteres.";
    }

    if (confirmation !== password) {
      nextErrors.confirmation = "As senhas não coincidem.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setSubmitError("");

    if (!validateForm()) return;

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSubmitError("Não foi possível atualizar sua senha. Tente novamente.");
      setIsSaving(false);
      return;
    }

    setSuccessMessage(
      mode === "recovery"
        ? "Senha redefinida com sucesso."
        : "Senha criada com sucesso.",
    );
    setIsSaving(false);

    window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1000);
  }

  if (isCheckingSession) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Verificando link...
      </p>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Este link não é válido ou expirou.
        </p>
        <Button
          type="button"
          onClick={() => router.replace("/login")}
          className="h-10 w-full rounded-md bg-[#030213] text-[12px] font-medium text-white hover:bg-[#030213]/90"
        >
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <PasswordField
        id="new-password"
        label="Nova senha"
        value={password}
        visible={showPassword}
        error={errors.password}
        autoComplete="new-password"
        onChange={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
        }}
        onToggleVisibility={() => setShowPassword((current) => !current)}
      />

      <PasswordField
        id="confirm-password"
        label="Confirmar senha"
        value={confirmation}
        visible={showConfirmation}
        error={errors.confirmation}
        autoComplete="new-password"
        onChange={(value) => {
          setConfirmation(value);
          setErrors((current) => ({ ...current, confirmation: undefined }));
        }}
        onToggleVisibility={() => setShowConfirmation((current) => !current)}
      />

      <p className="text-[11px] text-muted-foreground">
        Use pelo menos 8 caracteres.
      </p>

      {successMessage ? (
        <p className="text-[11px] text-green-600" role="status">
          {successMessage}
        </p>
      ) : null}

      {submitError ? (
        <p className="text-[11px] text-red-500" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSaving}
        className="h-10 w-full rounded-md bg-[#030213] text-[12px] font-medium text-white hover:bg-[#030213]/90"
      >
        {isSaving
          ? "Salvando..."
          : mode === "recovery"
            ? "Redefinir senha"
            : "Salvar senha"}
      </Button>
    </form>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  error?: string;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordField({
  id,
  label,
  value,
  visible,
  error,
  autoComplete,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-medium text-foreground">
        {label}
      </label>
      <div
        className={`mt-1.5 flex h-10 items-center rounded-md border bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 ${
          error ? "border-red-300" : "border-input"
        }`}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite sua senha"
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-[11px] text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
