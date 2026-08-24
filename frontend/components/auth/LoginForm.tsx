"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type LoginErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsError, setCredentialsError] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  function validateEmail() {
    let emailError: string | undefined;

    if (!email.trim()) {
      emailError = "Informe seu e-mail.";
    } else if (!isValidEmail(email)) {
      emailError = "Digite um e-mail válido.";
    }

    setErrors((current) => ({ ...current, email: emailError }));
    return !emailError;
  }

  function validateForm() {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Digite um e-mail válido.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    } else if (password.length < 6) {
      nextErrors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCredentialsError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setCredentialsError("E-mail ou senha inválidos.");
      setIsLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handlePasswordRecovery() {
    setRecoveryMessage("");
    setRecoveryError("");

    if (!validateEmail()) return;

    setIsSendingRecovery(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        },
      );

      if (error) {
        setRecoveryError(
          "Não foi possível enviar o e-mail agora. Tente novamente.",
        );
        return;
      }

      setRecoveryMessage(
        "Enviamos um link para redefinir sua senha. Verifique seu e-mail.",
      );
    } catch {
      setRecoveryError(
        "Não foi possível enviar o e-mail agora. Tente novamente.",
      );
    } finally {
      setIsSendingRecovery(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      noValidate
      className="space-y-5"
    >
      <div>
        <label htmlFor="email" className="text-[11px] font-medium text-foreground">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setCredentialsError("");
            setRecoveryMessage("");
            setRecoveryError("");
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="seu@email.com"
          autoComplete="off"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 ${
            errors.email ? "border-red-300" : "border-input"
          }`}
        />
        {errors.email ? (
          <p id="email-error" className="mt-1.5 text-[11px] text-red-500">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-[11px] font-medium text-foreground"
        >
          Senha
        </label>
        <div
          className={`mt-1.5 flex h-10 items-center rounded-md border bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 ${
            errors.password ? "border-red-300" : "border-input"
          }`}
        >
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setCredentialsError("");
            }}
            placeholder="Digite sua senha"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-[11px] text-red-500">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-black/20 text-[#030213] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
          />
          Lembrar de mim
        </label>
        <button
          type="button"
          onClick={handlePasswordRecovery}
          disabled={isSendingRecovery}
          className="text-[11px] font-medium text-foreground hover:underline"
        >
          {isSendingRecovery ? "Enviando..." : "Esqueci minha senha"}
        </button>
      </div>

      {credentialsError ? (
        <p className="text-[11px] text-red-500">{credentialsError}</p>
      ) : null}

      {recoveryMessage ? (
        <p className="text-[11px] text-green-600" role="status">
          {recoveryMessage}
        </p>
      ) : null}

      {recoveryError ? (
        <p className="text-[11px] text-red-500" role="alert">
          {recoveryError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isLoading}
        className="h-10 w-full rounded-md bg-primary text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
