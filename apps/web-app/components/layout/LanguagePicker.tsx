"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/types";

interface LanguagePickerProps {
  isCollapsed: boolean;
}

export function LanguagePicker({ isCollapsed }: LanguagePickerProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguageStore();
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const langPickerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) {
        setIsLangPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedLocale: Locale) => {
    setLocale(selectedLocale);
    setIsLangPickerOpen(false);
  };

  const languages: { id: Locale; label: string; flag: string }[] = [
    { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { id: "en", label: "English", flag: "🇺🇸" },
  ];

  return (
    <div ref={langPickerRef} className="relative">
      <button
        onClick={() => setIsLangPickerOpen(prev => !prev)}
        title={isCollapsed ? t.sidebar.language : undefined}
        className={cn(
          "flex w-full items-center rounded-xl py-2.5 cursor-pointer",
          isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
          "text-sm font-medium text-muted-foreground",
          "transition-all duration-150",
          "hover:bg-accent hover:text-foreground",
          "active:scale-[0.97]",
          isLangPickerOpen && "bg-accent text-foreground"
        )}
      >
        {/* Globe icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[18px] h-[18px] shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>

        {!isCollapsed && (
          <span className="flex items-center gap-1.5 w-full">
            {t.sidebar.language}
            <span className="ml-auto text-[11px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
              {locale.toUpperCase()}
            </span>
          </span>
        )}
      </button>

      {/* Popover panel */}
      {isLangPickerOpen && (
        <div className={cn(
          "absolute z-50 bottom-10 bg-card border border-border rounded-2xl shadow-2xl p-3 flex flex-col gap-1",
          isCollapsed ? "left-12" : "left-0",
          "w-48"
        )}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">
            {t.sidebar.language}
          </p>
          {languages.map((lang) => {
            const isSelected = locale === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleSelect(lang.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer w-full text-left transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm shrink-0 leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-primary shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
