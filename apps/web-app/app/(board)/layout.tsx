"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/features/auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  if (showSetup) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-background p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6 scrollbar-thin">
        {children}
      </main>
    </div>
  );
}

