import { create } from "zustand";

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  wakeTime?: string | null;
  sleepTime?: string | null;
  bufferPct?: number;
  timezone?: string;
}

export interface AuthSession {
  user: AuthUser;
}
function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (typeof candidate.id === "string" || typeof candidate.id === "number") &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    (candidate.role === undefined || typeof candidate.role === "string") &&
    (candidate.wakeTime === undefined || candidate.wakeTime === null || typeof candidate.wakeTime === "string") &&
    (candidate.sleepTime === undefined || candidate.sleepTime === null || typeof candidate.sleepTime === "string") &&
    (candidate.bufferPct === undefined || typeof candidate.bufferPct === "number") &&
    (candidate.timezone === undefined || typeof candidate.timezone === "string")
  );
}

export function normalizeAuthSession(payload: unknown): AuthSession | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  if (isAuthUser(candidate.user)) {
    return {
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
  user: AuthUser | null;
  isInitialized: boolean;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setSession: (session) =>
    set({
      user: session?.user ?? null,
      isInitialized: true,
    }),
  clearSession: () =>
    set({ user: null, isInitialized: true }),
}));
