"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore, useOnboardingStore, ProfileDialog } from "@/features/auth";
import { getShortName } from "@/lib/name-helper";
import {
  Calendar03Icon,
  Grid02Icon,
  UserCircleIcon,
  Time02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Target02Icon,
  Analytics01Icon
} from "@hugeicons/core-free-icons";
import { useAvailableTime } from "@/features/available-time";
import { FeedbackModal } from "../feedback/FeedbackModal";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: typeof Grid02Icon;
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Plan your day", href: "/", icon: Grid02Icon },
  { id: "goals", label: "Goals", href: "/goals", icon: Target02Icon },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar03Icon },
  { id: "flow", label: "Flow", href: "/flow", icon: Time02Icon },
  { id: "stats", label: "Analytics", href: "/stats", icon: Analytics01Icon },
];

const HelpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const FeedbackIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

type ThemeId = "dark" | "light" | "graphite" | "nord" | "sage" | "rose";

const THEMES: { id: ThemeId; label: string; bg: string; ring: string; dark: boolean }[] = [
  { id: "dark",     label: "Midnight",  bg: "#020617", ring: "#3b82f6",  dark: true  },
  { id: "graphite", label: "Graphite",  bg: "#171717", ring: "#818cf8",  dark: true  },
  { id: "nord",     label: "Nord",      bg: "#2e3440", ring: "#88c0d0",  dark: true  },
  { id: "rose",     label: "Rosé",      bg: "#1a1014", ring: "#f43f5e",  dark: true  },
  { id: "light",    label: "Ivory",     bg: "#faf9f7", ring: "#2563eb",  dark: false },
  { id: "sage",     label: "Sage",      bg: "#f0f4f0", ring: "#16a34a",  dark: false },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const startOnboarding = useOnboardingStore((s) => s.startOnboarding);
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  useEffect(() => {
    Promise.resolve().then(() => {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved === "true") setIsCollapsed(true);
    });
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const { data: availableTime, fetchAvailableTime } = useAvailableTime();

  useEffect(() => {
    fetchAvailableTime(today);
  }, [today, fetchAvailableTime]);

  return (
    <>
      <aside className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-sidebar py-6 transition-all duration-300",
        isCollapsed ? "w-20 px-2" : "w-60 px-4"
      )}>
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div className={cn("mb-6 flex items-center", isCollapsed ? "justify-center px-1" : "justify-between px-2")}>
          {!isCollapsed && (
            <div>
              <div className="text-xl font-bold tracking-wide text-foreground">
                My<span className="text-primary">PACE</span>
              </div>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Productive Calm
              </p>
            </div>
          )}
          <button 
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon} size={18} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex flex-col gap-1">
          {!isCollapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground px-2 mb-1">
              Views
            </span>
          )}

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center rounded-xl py-2.5",
                  isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
                  "text-sm font-medium",
                  "transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  "active:scale-[0.97]"
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-primary" : ""
                  )}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* ── Spacer ───────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Start Time Label ── */}
        {!isCollapsed && availableTime?.checkedIn && availableTime.checkinTime && (
          <div className="px-2 pb-2">
            <span className="text-xs text-muted-foreground block">
              Hôm nay bắt đầu lúc: <span className="font-semibold text-foreground">{availableTime.checkinTime}</span>
            </span>
          </div>
        )}

        {/* ── Bottom section ──────────────────────────────────────── */}
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            title={isCollapsed ? getShortName(user?.name) : undefined}
            className={cn(
              "flex w-full items-center rounded-xl py-2.5",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
              "text-sm font-medium text-muted-foreground",
              "transition-all duration-150",
              "hover:bg-accent hover:text-foreground",
              "active:scale-[0.97]"
            )}
          >
            <HugeiconsIcon icon={UserCircleIcon} size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">{getShortName(user?.name)}</span>}
          </button>

          {/* Help Button */}
          <button
            onClick={() => startOnboarding(true)}
            title={isCollapsed ? "Triết lý MyPACE" : undefined}
            className={cn(
              "flex w-full items-center rounded-xl py-2.5",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
              "text-sm font-medium text-muted-foreground",
              "transition-all duration-150",
              "hover:bg-accent hover:text-foreground",
              "active:scale-[0.97]"
            )}
          >
            <HelpIcon className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span>Triết lý MyPACE</span>}
          </button>

          {/* Feedback Button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            title={isCollapsed ? "Góp ý & Phản hồi" : undefined}
            className={cn(
              "flex w-full items-center rounded-xl py-2.5",
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
              "text-sm font-medium text-muted-foreground",
              "transition-all duration-150",
              "hover:bg-accent hover:text-foreground",
              "active:scale-[0.97]"
            )}
          >
            <FeedbackIcon className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span>Góp ý & Phản hồi</span>}
          </button>

          {/* Theme Picker */}
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

        </div>
      </aside>

      {/* Profile Edit Dialog */}
      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <FeedbackModal isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
