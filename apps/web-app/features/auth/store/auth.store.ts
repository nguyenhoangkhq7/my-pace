import { create } from "zustand";

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export type AuthSessionPayload = AuthSession | {
  token?: unknown;
  accessToken?: unknown;
  user?: unknown;
  data?: unknown;
};

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (typeof candidate.id === "string" || typeof candidate.id === "number") &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}

export function normalizeAuthSession(payload: unknown): AuthSession | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  const accessToken =
    typeof candidate.accessToken === "string"
      ? candidate.accessToken
      : typeof candidate.token === "string"
        ? candidate.token
        : null;

  if (accessToken && isAuthUser(candidate.user)) {
    return {
      accessToken,
      user: candidate.user,
    };
  }

  if ("data" in candidate) {
    const nestedSession = normalizeAuthSession(candidate.data);

    if (nestedSession) {
      return nestedSession;
    }
  }

  return null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitialized: boolean;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setSession: (session) =>
    set({
      accessToken: session?.accessToken ?? null,
      user: session?.user ?? null,
      isInitialized: true,
    }),
  clearSession: () =>
    set({ accessToken: null, user: null, isInitialized: true }),
}));
