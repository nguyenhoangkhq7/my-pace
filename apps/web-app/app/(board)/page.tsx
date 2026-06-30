"use client";

import { useAuthStore, InitialSetupForm } from "@/features/auth";
import { UserCircleIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  if (showSetup) {
    return <InitialSetupForm />;
  }

  return (
    <>
      <div className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full py-8">
        {/* Welcome Header */}
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Welcome back, <span className="text-primary">{user?.name || "User"}</span>!
          </h1>
          <p className="text-muted-foreground text-sm">
            You are securely logged in to MyPACE.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Details Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <HugeiconsIcon icon={UserCircleIcon} size={24} />
                </div>
                <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</span>
                  <span className="text-sm font-medium text-foreground">{user?.name || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</span>
                  <span className="text-sm font-medium text-foreground">{user?.email || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Role</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 w-fit mt-1">
                    {user?.role || "USER"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Wake / Sleep</span>
                    <span className="text-xs font-medium text-foreground">{user?.wakeTime?.substring(0, 5) || "N/A"} - {user?.sleepTime?.substring(0, 5) || "N/A"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Buffer Time</span>
                    <span className="text-xs font-medium text-foreground">{user?.bufferPct ? `${user.bufferPct}%` : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Auth Session Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <HugeiconsIcon icon={Settings01Icon} size={24} />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Security Status</h2>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authentication Method</span>
                  <span className="text-sm font-medium text-foreground">JWT Access Token</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Stored in-memory + HTTP-only Refresh Cookie</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authorization</span>
                  <span className="text-sm font-medium text-foreground">Role-Based Access Control (RBAC)</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Permitted endpoints matched against user role</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>💡</span> Codebase Cleaned Up
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The task management, calendar, scheduling, and user notes modules have been successfully removed. The layout frame (shell), user registration (with OTP verification), login, session hydration, and role-based authorization remain active.
          </p>
        </div>
      </div>
    </>
  );
}
