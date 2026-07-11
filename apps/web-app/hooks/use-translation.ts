"use client";

import { useLanguageStore } from "@/features/settings/store/useLanguageStore";
import { vi } from "@/lib/i18n/vi";
import { en } from "@/lib/i18n/en";
import type { Locale, Translations } from "@/lib/i18n/types";

const translations: Record<Locale, Translations> = { vi, en };

export function useTranslation() {
  const locale = useLanguageStore((s) => s.locale);
  const t = translations[locale];
  return { t, locale };
}
