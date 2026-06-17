"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore } from "@/features/auth";
import {
  Grid02Icon,
  Settings01Icon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";

type NavItem = {
  id: string;
  label: string;
  icon: typeof Grid02Icon;
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Grid02Icon },
];

export function Sidebar() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const activeView = "dashboard";

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="mb-6 px-2">
        <div className="text-xl font-bold tracking-wide text-foreground">
          My<span className="text-primary">PACE</span>
        </div>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Productive Calm
        </p>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Views
        </span>

        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
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
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Bottom section ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
            "text-sm font-medium text-muted-foreground",
            "transition-all duration-150",
            "hover:bg-accent hover:text-foreground",
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
            "text-sm font-medium text-muted-foreground",
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
