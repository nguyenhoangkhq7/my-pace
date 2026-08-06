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
  const nameVal = candidate.name ?? candidate.fullName;

  return (
    (typeof candidate.id === "string" || typeof candidate.id === "number") &&
    (typeof nameVal === "string" || nameVal === null || nameVal === undefined) &&
    typeof candidate.email === "string" &&
    (candidate.role === undefined || typeof candidate.role === "string") &&
    (candidate.wakeTime === undefined || candidate.wakeTime === null || typeof candidate.wakeTime === "string") &&
    (candidate.sleepTime === undefined || candidate.sleepTime === null || typeof candidate.sleepTime === "string") &&
    (candidate.bufferPct === undefined || typeof candidate.bufferPct === "number") &&
    (candidate.timezone === undefined || typeof candidate.timezone === "string")
  );
}

function extractUser(rawUser: Record<string, unknown>): AuthUser {
  const resolvedName =
    (typeof rawUser.name === "string" && rawUser.name) ||
    (typeof rawUser.fullName === "string" && rawUser.fullName) ||
    "";

  return {
    id: (rawUser.id as string | number) ?? "",
    name: resolvedName,
    email: (rawUser.email as string) || "",
    role: rawUser.role as string | undefined,
    wakeTime: rawUser.wakeTime as string | null | undefined,
    sleepTime: rawUser.sleepTime as string | null | undefined,
    bufferPct: typeof rawUser.bufferPct === "number" ? rawUser.bufferPct : 20,
    timezone: (rawUser.timezone as string) || "Asia/Ho_Chi_Minh",
  };
}

export function normalizeAuthSession(payload: unknown): AuthSession | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  // Case 1: candidate has { user: ... }
  if (typeof candidate.user === "object" && candidate.user !== null && isAuthUser(candidate.user)) {
    return {
      user: extractUser(candidate.user as unknown as Record<string, unknown>),
    };
  }

  // Case 2: candidate itself is user object
  if (isAuthUser(candidate)) {
    return {
      user: extractUser(candidate),
    };
  }

  // Case 3: candidate has { data: ... }
  if ("data" in candidate && candidate.data) {
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
