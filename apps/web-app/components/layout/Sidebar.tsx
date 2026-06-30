"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuthStore, useOnboardingStore, ProfileDialog } from "@/features/auth";
import { getShortName } from "@/lib/name-helper";
import { post } from "@/lib/fetchClient";
import {
  Calendar03Icon,
  Grid02Icon,
  Logout03Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { useAvailableTime } from "@/features/available-time";
import { useEffect } from "react";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: typeof Grid02Icon;
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: Grid02Icon },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar03Icon },
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

export function Sidebar() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const startOnboarding = useOnboardingStore((s) => s.startOnboarding);
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const { data: availableTime, fetchAvailableTime, checkin, isLoading } = useAvailableTime();

  useEffect(() => {
    fetchAvailableTime(today);
  }, [today, fetchAvailableTime]);

  const handleCheckin = async () => {
    await checkin(today);
  };

  const handleLogout = async () => {
    try {
      await post("auth/logout", {});
    } catch (err) {
      console.error("Logout failed at backend", err);
    } finally {
      clearSession();
      window.location.href = "/login";
    }
  };

  return (
    <>
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
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
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

        {/* ── Start Time Label ── */}
        {availableTime?.checkedIn && availableTime.checkinTime && (
          <div className="mt-6 pt-5 border-t border-border/50 px-2">
            <span className="text-xs text-muted-foreground block">
              Hôm nay bắt đầu lúc: <span className="font-semibold text-foreground">{availableTime.checkinTime}</span>
            </span>
          </div>
        )}

        {/* ── Spacer ───────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Bottom section ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          {/* User Profile Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
              "text-sm font-medium text-muted-foreground",
              "transition-all duration-150",
              "hover:bg-accent hover:text-foreground",
              "active:scale-[0.97]"
            )}
          >
            <HugeiconsIcon icon={UserCircleIcon} size={18} className="shrink-0" />
            <span className="truncate">{getShortName(user?.name)}</span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => startOnboarding(true)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
              "text-sm font-medium text-muted-foreground",
              "transition-all duration-150",
              "hover:bg-accent hover:text-foreground",
              "active:scale-[0.97]"
            )}
          >
            <HelpIcon className="w-[18px] h-[18px] shrink-0" />
            <span>Triết lý MyPACE</span>
          </button>

          {/* Logout Button */}
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

      {/* Profile Edit Dialog */}
      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
}
