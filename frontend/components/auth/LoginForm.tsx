"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  authenticateMockUser,
  saveStoredMockAuthUser,
} from "@/lib/mock-auth";

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCredentialsError("");

    if (!validateForm()) {
      return;
    }

    const user = authenticateMockUser(email, password);

    if (!user) {
      setCredentialsError("E-mail ou senha inválidos.");
      return;
    }

    saveStoredMockAuthUser(user);
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="text-[11px] font-medium text-[#0A0A0A]">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setCredentialsError("");
          }}
          placeholder="seu@email.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`mt-1.5 h-10 w-full rounded-md border bg-white px-3 text-sm text-[#0A0A0A] outline-none transition-colors placeholder:text-[#717182]/70 focus:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 ${
            errors.email ? "border-red-300" : "border-black/10"
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
          className="text-[11px] font-medium text-[#0A0A0A]"
        >
          Senha
        </label>
        <div
          className={`mt-1.5 flex h-10 items-center rounded-md border bg-white transition-colors focus-within:border-[#0A0A0A] focus-within:ring-2 focus-within:ring-[#0A0A0A]/10 ${
            errors.password ? "border-red-300" : "border-black/10"
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
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm text-[#0A0A0A] outline-none placeholder:text-[#717182]/70"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#717182] hover:bg-gray-50 hover:text-[#0A0A0A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
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
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#717182]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-black/20 text-[#030213] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
          />
          Lembrar de mim
        </label>
        <a
          href="#"
          className="text-[11px] font-medium text-[#0A0A0A] hover:underline"
        >
          Esqueci minha senha
        </a>
      </div>

      {credentialsError ? (
        <p className="text-[11px] text-red-500">{credentialsError}</p>
      ) : null}

      <Button
        type="submit"
        className="h-10 w-full rounded-md bg-[#030213] text-[12px] font-medium text-white hover:bg-[#030213]/90"
      >
        Entrar
      </Button>
    </form>
  );
}
