"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore } from "@/features/auth";
import { useFilterStore } from "@/stores/filter.store";
import {
  Grid02Icon,
  Calendar01Icon,
  ChartHistogramIcon,
  Archive01Icon,
  Settings01Icon,
  Logout03Icon,
  PlusSignIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";

type NavItem = {
  id: string;
  label: string;
  icon: typeof Grid02Icon;
};

const NAV_ITEMS: NavItem[] = [
  { id: "matrix", label: "Today", icon: Grid02Icon },
  { id: "board", label: "Board", icon: Task01Icon },
  { id: "calendar", label: "Calendar", icon: Calendar01Icon },
  { id: "analytics", label: "Analytics", icon: ChartHistogramIcon },
  { id: "archive", label: "Archive", icon: Archive01Icon },
];

type SidebarProps = {
  activeView: string;
  onViewChange: (view: string) => void;
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const setIsNewItemModalOpen = useFilterStore((s) => s.setIsNewItemModalOpen);

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-pace-sidebar px-4 py-6">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="mb-1 px-2">
        <div className="text-xl font-bold tracking-wide text-slate-100">
          My<span className="text-pace-accent">PACE</span>
        </div>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-pace-muted">
          Productive Calm
        </p>
      </div>

      {/* ── + New button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsNewItemModalOpen(true)}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2",
          "rounded-xl bg-pace-accent px-4 py-2.5",
          "text-sm font-semibold text-slate-950",
          "shadow-sm shadow-pace-accent/20",
          "transition-all duration-150",
          "hover:brightness-110 hover:shadow-md hover:shadow-pace-accent/30",
          "active:scale-[0.97]"
        )}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={16} />
        <span>New</span>
      </button>

      {/* ── MENU section ─────────────────────────────────────────────── */}
      <div className="mt-7 mb-2 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pace-muted">
          Menu
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
                "text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-pace-accent/15 text-pace-accent shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
                "active:scale-[0.97]"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                className={cn(
                  "shrink-0",
                  isActive ? "text-pace-accent" : ""
                )}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Bottom section ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 border-t border-slate-800 pt-4">
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
            "text-sm font-medium text-slate-400",
            "transition-all duration-150",
            "hover:bg-slate-800/60 hover:text-slate-100",
            "active:scale-[0.97]"
          )}
        >
          <HugeiconsIcon icon={Settings01Icon} size={18} className="shrink-0" />
          <span>Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
            "text-sm font-medium text-slate-400",
            "transition-all duration-150",
            "hover:bg-rose-500/10 hover:text-rose-400",
            "active:scale-[0.97]"
          )}
        >
          <HugeiconsIcon icon={Logout03Icon} size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
