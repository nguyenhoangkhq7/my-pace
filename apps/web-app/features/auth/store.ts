import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user, isInitialized: true }),
  clearUser: () => set({ user: null, isInitialized: false }),
}));
