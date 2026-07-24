"use client";

import React, { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/features/auth";
import { OnboardingModal } from "@/features/onboarding";
import { usePathname } from "next/navigation";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";

import { StickyNotesOverlay } from "@/features/sticky-notes/components/StickyNotesOverlay";
import { StickyNotesManagerDrawer } from "@/features/sticky-notes/components/StickyNotesManagerDrawer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const isFlowFullscreen = useFocusStore((s) => s.isFlowFullscreen);
  const isZenFull = useFocusStore((s) => s.isZenFull);

  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const isFlowPage = pathname === "/flow";
  const isFullscreenMode = isFlowPage && (isFlowFullscreen || isZenFull);
  const isBgActive = isFlowPage && isVideoBackground;
  const showSetup = user && (!user.wakeTime || !user.sleepTime);

  // Sync state if user exits browser fullscreen using Esc or browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isBrowserFullscreen = !!document.fullscreenElement;
      if (!isBrowserFullscreen && isFlowFullscreen) {
        useFocusStore.setState({ isFlowFullscreen: false });
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFlowFullscreen]);

  if (showSetup) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-background p-4">
        {children}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen overflow-hidden text-foreground transition-colors duration-300",
      isBgActive ? "bg-transparent" : "bg-background"
    )}>
      {!isFullscreenMode && <Sidebar />}
      <main 
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin transition-all duration-300 relative",
          (isFullscreenMode || isFlowPage) ? "p-0 overflow-hidden" : "px-8 py-6"
        )}
      >
        {children}
      </main>
      <OnboardingModal />
      <StickyNotesOverlay />
      <StickyNotesManagerDrawer />
    </div>
  );
}
