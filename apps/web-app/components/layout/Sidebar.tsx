"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore, useOnboardingStore, ProfileDialog } from "@/features/auth";
import { getShortName } from "@/lib/name-helper";
import {
  Calendar03Icon,
  Grid02Icon,
  UserCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Target02Icon,
  Analytics01Icon
} from "@hugeicons/core-free-icons";
import { useAvailableTime } from "@/features/available-time";
import { FeedbackModal } from "../feedback/FeedbackModal";
import { HelpIcon, FeedbackIcon } from "./SidebarIcons";
import { ThemePicker } from "./ThemePicker";

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

import { Time02Icon } from "@hugeicons/core-free-icons";

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const startOnboarding = useOnboardingStore((s) => s.startOnboarding);
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          <ThemePicker isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Profile Edit Dialog */}
      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <FeedbackModal isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
