import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type ThemeId = "dark" | "light" | "graphite" | "nord" | "sage" | "rose";

const THEMES: { id: ThemeId; label: string; bg: string; ring: string; dark: boolean }[] = [
  { id: "dark",     label: "Midnight",  bg: "#020617", ring: "#3b82f6",  dark: true  },
  { id: "graphite", label: "Graphite",  bg: "#171717", ring: "#818cf8",  dark: true  },
  { id: "nord",     label: "Nord",      bg: "#2e3440", ring: "#88c0d0",  dark: true  },
  { id: "rose",     label: "Rosé",      bg: "#1a1014", ring: "#f43f5e",  dark: true  },
  { id: "light",    label: "Ivory",     bg: "#faf9f7", ring: "#2563eb",  dark: false },
  { id: "sage",     label: "Sage",      bg: "#f0f4f0", ring: "#16a34a",  dark: false },
];

interface ThemePickerProps {
  isCollapsed: boolean;
}

export function ThemePicker({ isCollapsed }: ThemePickerProps) {
  const [theme, setTheme] = useState<ThemeId>("dark");
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      const savedTheme = (localStorage.getItem("theme") as ThemeId) || "dark";
      setTheme(savedTheme);
    });
  }, []);

  // Close theme picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setIsThemePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyTheme = (newTheme: ThemeId) => {
    setTheme(newTheme);
    setIsThemePickerOpen(false);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    root.classList.remove("dark", "light", "graphite", "nord", "sage", "rose");
    root.classList.add(newTheme);
    const isDark = THEMES.find(t => t.id === newTheme)?.dark ?? true;
    // eslint-disable-next-line react-hooks/immutability
    root.style.colorScheme = isDark ? "dark" : "light";
  };

  return (
    <div ref={themePickerRef} className="relative">
      <button
        onClick={() => setIsThemePickerOpen(prev => !prev)}
        title={isCollapsed ? "Chọn giao diện" : undefined}
        className={cn(
          "flex w-full items-center rounded-xl py-2.5 cursor-pointer",
          isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
          "text-sm font-medium text-muted-foreground",
          "transition-all duration-150",
          "hover:bg-accent hover:text-foreground",
          "active:scale-[0.97]",
          isThemePickerOpen && "bg-accent text-foreground"
        )}
      >
        {/* Mini preview swatch of current theme */}
        <span
          className="shrink-0 w-[18px] h-[18px] rounded-full border-2 transition-all"
          style={{
            background: THEMES.find(t => t.id === theme)?.bg,
            borderColor: THEMES.find(t => t.id === theme)?.ring,
          }}
        />
        {!isCollapsed && <span>Giao diện</span>}
      </button>

      {/* Popover panel */}
      {isThemePickerOpen && (
        <div className={cn(
          "absolute z-50 bottom-10 bg-card border border-border rounded-2xl shadow-2xl p-4",
          isCollapsed ? "left-12" : "left-0",
          "w-52"
        )}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Chọn giao diện</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                title={t.label}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer",
                  theme === t.id
                    ? "bg-muted ring-2 ring-offset-1 ring-offset-card"
                    : "hover:bg-muted/60"
                )}
              >
                {/* Color swatch */}
                <span
                  className="w-8 h-8 rounded-full border-2 shadow-md transition-transform hover:scale-110"
                  style={{
                    background: t.bg,
                    borderColor: theme === t.id ? t.ring : "transparent",
                    boxShadow: theme === t.id ? `0 0 0 2px ${t.ring}40` : undefined,
                  }}
                />
                <span className={cn(
                  "text-[10px] font-semibold leading-tight text-center",
                  theme === t.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
