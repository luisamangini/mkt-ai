import type { InviteUserInput, SettingsUser } from "@/types/settings";
import { supabase } from "@/lib/supabase/client";

const DEFAULT_API_URL = "http://localhost:8000";

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredText(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Usuário retornado com campo inválido: ${key}.`);
  }
  return value;
}

function normalizeUser(value: unknown): SettingsUser {
  if (!isRecord(value)) {
    throw new Error("Usuário retornado pela API possui formato inválido.");
  }

  const lastSignInAt = value.last_sign_in_at;
  if (typeof lastSignInAt !== "string" && lastSignInAt !== null) {
    throw new Error("Usuário retornado com último acesso inválido.");
  }

  return {
    id: requiredText(value, "id"),
    name: typeof value.name === "string" ? value.name : "",
    email: requiredText(value, "email"),
    createdAt: requiredText(value, "created_at"),
    lastSignInAt: lastSignInAt || null,
  };
}

function getErrorDetail(payload: unknown) {
  if (!isRecord(payload)) return "";
  if (typeof payload.detail === "string") return payload.detail;
  if (!Array.isArray(payload.detail) || !isRecord(payload.detail[0])) return "";
  const message = payload.detail[0].msg;
  return typeof message === "string" ? message.replace(/^Value error, /, "") : "";
}

export async function fetchSettingsUsers(): Promise<SettingsUser[]> {
  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/users`, {
    headers: { Accept: "application/json" },
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const detail = isRecord(payload) && typeof payload.detail === "string"
      ? payload.detail
      : "";
    throw new Error(detail || `Erro HTTP ao buscar usuários: ${response.status}`);
  }

  if (!isRecord(payload) || payload.status !== "ok" || !Array.isArray(payload.users)) {
    throw new Error("Resposta da API de usuários possui formato inválido.");
  }

  return payload.users.map(normalizeUser);
}

export async function inviteSettingsUser(input: InviteUserInput): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente para convidar usuários.");
  }

  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/users/invite`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: input.email.trim() }),
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorDetail(payload) || "Não foi possível enviar o convite.");
  }

  if (!isRecord(payload) || payload.status !== "ok") {
    throw new Error("Resposta da API de convite possui formato inválido.");
  }
}

export async function deleteCurrentAccount(): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente para excluir sua conta.");
  }

  const response = await fetch(`${getApiUrl().replace(/\/$/, "")}/users/me`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorDetail(payload) || "Não foi possível excluir sua conta.");
  }
  if (!isRecord(payload) || payload.status !== "ok") {
    throw new Error("Resposta da API de exclusão possui formato inválido.");
  }
}
