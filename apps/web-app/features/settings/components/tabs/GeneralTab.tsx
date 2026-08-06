import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";
import { useQuickAddUIStore } from "@/features/quick-add/store/quickAddUI.store";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const LANGUAGES: { id: Locale; label: string; flag: string }[] = [
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", label: "English", flag: "🇺🇸" },
];

export function GeneralTab() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguageStore();
  const { autoConfirm, toggleAutoConfirm } = useQuickAddUIStore();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t.settingsModal.generalTitle}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.settingsModal.generalDesc}
        </p>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">{t.sidebar.language}</label>
        <div className="grid grid-cols-2 gap-2.5">
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setLocale(lang.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border",
                  isSelected
                    ? "bg-primary/5 border-primary text-primary font-medium shadow-2xs"
                    : "bg-card border-border/50 hover:bg-accent hover:border-border text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <span className="text-xs font-medium">{lang.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Add */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <label className="text-xs font-semibold text-foreground">{t.settingsModal.quickAddTitle}</label>
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/60">
          <div className="flex flex-col pr-4">
            <span className="text-xs font-medium text-foreground">{t.quickAdd.autoConfirm}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {t.settingsModal.autoConfirmDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleAutoConfirm}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shrink-0",
              autoConfirm
                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {autoConfirm ? t.settingsModal.toggleOn : t.settingsModal.toggleOff}
          </button>
        </div>
      </div>
    </div>
  );
}
