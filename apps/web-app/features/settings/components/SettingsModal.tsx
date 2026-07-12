import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore } from "@/features/auth";
import { getShortName } from "@/lib/name-helper";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";
import type { Locale } from "@/lib/i18n/types";
import { Settings } from "lucide-react";
import { HelpIcon, FeedbackIcon } from "@/components/layout/SidebarIcons";

type ThemeId = "dark" | "light" | "graphite" | "nord" | "sage" | "rose";

const THEMES: { id: ThemeId; label: string; bg: string; ring: string; dark: boolean }[] = [
  { id: "dark",     label: "Midnight",  bg: "#020617", ring: "#3b82f6",  dark: true  },
  { id: "graphite", label: "Graphite",  bg: "#171717", ring: "#818cf8",  dark: true  },
  { id: "nord",     label: "Nord",      bg: "#2e3440", ring: "#88c0d0",  dark: true  },
  { id: "rose",     label: "Rosé",      bg: "#1a1014", ring: "#f43f5e",  dark: true  },
  { id: "light",    label: "Ivory",     bg: "#faf9f7", ring: "#2563eb",  dark: false },
  { id: "sage",     label: "Sage",      bg: "#f0f4f0", ring: "#16a34a",  dark: false },
];

const LANGUAGES: { id: Locale; label: string; flag: string }[] = [
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", label: "English", flag: "🇺🇸" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile: () => void;
  onOpenPhilosophy: () => void;
  onOpenFeedback: () => void;
}

export function SettingsModal({
  isOpen,
  onOpenChange,
  onOpenProfile,
  onOpenPhilosophy,
  onOpenFeedback
}: SettingsModalProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  
  const [theme, setTheme] = useState<ThemeId>("dark");
  const { locale, setLocale } = useLanguageStore();

  useEffect(() => {
    if (isOpen) {
      const savedTheme = (localStorage.getItem("theme") as ThemeId) || "dark";
      setTheme(savedTheme);
    }
  }, [isOpen]);

  const applyTheme = (newTheme: ThemeId) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    root.classList.remove("dark", "light", "graphite", "nord", "sage", "rose");
    root.classList.add(newTheme);
    const isDark = THEMES.find(t => t.id === newTheme)?.dark ?? true;
    root.style.colorScheme = isDark ? "dark" : "light";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-muted-foreground" />
            {t.sidebar.settings}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account */}
          <div className="space-y-2">
            <button
              onClick={() => { onOpenChange(false); onOpenProfile(); }}
              className="flex w-full items-center gap-3 rounded-xl p-3 bg-muted/50 hover:bg-accent transition-colors"
            >
              <HugeiconsIcon icon={UserCircleIcon} size={32} className="text-muted-foreground shrink-0" />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-semibold truncate w-full text-left">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate w-full text-left">{user?.email}</span>
              </div>
            </button>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.sidebar.theme}</label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => applyTheme(tItem.id as ThemeId)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all cursor-pointer border-2",
                    theme === tItem.id
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-card border-transparent hover:bg-accent hover:border-border"
                  )}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-border/50"
                    style={{ background: tItem.bg, borderColor: tItem.ring, borderWidth: 2 }}
                  />
                  <span className="text-[11px] font-medium">{tItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.sidebar.language}</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLocale(lang.id)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl transition-all cursor-pointer border-2",
                    locale === lang.id
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-card border-transparent hover:bg-accent hover:border-border"
                  )}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span className="text-xs font-semibold">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* About & Support */}
          <div className="space-y-1 pt-4 border-t border-border/50">
            <button
              onClick={() => { onOpenChange(false); onOpenPhilosophy(); }}
              className="flex w-full items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <HelpIcon className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{t.sidebar.philosophy}</span>
            </button>
            <button
              onClick={() => { onOpenChange(false); onOpenFeedback(); }}
              className="flex w-full items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <FeedbackIcon className="w-[18px] h-[18px]" />
              <span className="text-sm font-medium">{t.sidebar.feedback}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
