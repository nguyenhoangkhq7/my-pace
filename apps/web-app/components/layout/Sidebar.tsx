"use client";

import { useState } from "react";
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
  Analytics01Icon,
} from "@hugeicons/core-free-icons";
import { useAvailableTime } from "@/features/available-time";
import { useEffect } from "react";
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

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const startOnboarding = useOnboardingStore((s) => s.startOnboarding);
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const { data: availableTime, fetchAvailableTime, checkin, isLoading } = useAvailableTime();

  useEffect(() => {
    fetchAvailableTime(today);
  }, [today, fetchAvailableTime]);

  const handleCheckin = async () => {
    await checkin(today);
  };

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

        </div>
      </aside>

      {/* Profile Edit Dialog */}
      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <FeedbackModal isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
