import type { MockAuthCredential, MockAuthUser } from "@/types/auth";

export const MOCK_AUTH_STORAGE_KEY = "consoria_auth_user";

const mockUsers: MockAuthCredential[] = [
  {
    name: "Marcos Ferreira",
    email: "marcos@consoria.com.br",
    password: "consoria123",
    role: "Admin",
  },
  {
    name: "Camila Santos",
    email: "camila@consoria.com.br",
    password: "consoria123",
    role: "Editor",
  },
];

function isMockAuthUser(value: unknown): value is MockAuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MockAuthUser>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    (candidate.role === "Admin" || candidate.role === "Editor")
  );
}

export function authenticateMockUser(
  email: string,
  password: string,
): MockAuthUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const user = mockUsers.find(
    (mockUser) =>
      mockUser.email.toLowerCase() === normalizedEmail &&
      mockUser.password === password,
  );

  if (!user) {
    return null;
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function getStoredMockAuthUser(): MockAuthUser | null {
  const rawUser = window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser: unknown = JSON.parse(rawUser);

    if (!isMockAuthUser(parsedUser)) {
      removeStoredMockAuthUser();
      return null;
    }

    return parsedUser;
  } catch {
    removeStoredMockAuthUser();
    return null;
  }
}

export function saveStoredMockAuthUser(user: MockAuthUser) {
  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function removeStoredMockAuthUser() {
  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
}

export function hasStoredMockAuthUser() {
  return getStoredMockAuthUser() !== null;
}
