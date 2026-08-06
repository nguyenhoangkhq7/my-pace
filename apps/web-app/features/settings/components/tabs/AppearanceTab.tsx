import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type ThemeId = "dark" | "light" | "graphite" | "nord" | "sage" | "rose";

const THEMES: { id: ThemeId; label: string; bg: string; ring: string; dark: boolean }[] = [
  { id: "dark",     label: "Midnight",  bg: "#020617", ring: "#3b82f6",  dark: true  },
  { id: "graphite", label: "Graphite",  bg: "#171717", ring: "#818cf8",  dark: true  },
  { id: "nord",     label: "Nord",      bg: "#2e3440", ring: "#88c0d0",  dark: true  },
  { id: "rose",     label: "Rosé",      bg: "#1a1014", ring: "#f43f5e",  dark: true  },
  { id: "light",    label: "Ivory",     bg: "#faf9f7", ring: "#2563eb",  dark: false },
  { id: "sage",     label: "Sage",      bg: "#f0f4f0", ring: "#16a34a",  dark: false },
];

export function AppearanceTab() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as ThemeId) || "dark";
    }
    return "dark";
  });

  const applyTheme = (newTheme: ThemeId) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    root.classList.remove("dark", "light", "graphite", "nord", "sage", "rose");
    root.classList.add(newTheme);
    const isDark = THEMES.find(tItem => tItem.id === newTheme)?.dark ?? true;
    // eslint-disable-next-line react-hooks/immutability
    root.style.colorScheme = isDark ? "dark" : "light";
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{t.settingsModal.appearanceTitle}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.settingsModal.appearanceDesc}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((tItem) => {
          const isSelected = theme === tItem.id;
          return (
            <button
              key={tItem.id}
              onClick={() => applyTheme(tItem.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all cursor-pointer border-2",
                isSelected
                  ? "bg-primary/5 border-primary text-primary shadow-xs"
                  : "bg-card border-border/40 hover:bg-accent hover:border-border text-foreground"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-primary-foreground">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <span
                className="w-7 h-7 rounded-full border-2 shadow-xs transition-transform hover:scale-105"
                style={{ background: tItem.bg, borderColor: tItem.ring }}
              />
              <span className="text-xs font-semibold">{tItem.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
