import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n/types";

interface LanguageStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: "vi",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "my-pace-locale",
    }
  )
);
