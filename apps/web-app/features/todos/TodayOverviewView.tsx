"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useViewStore } from "./stores/view.store";
import Overview from "./components/overview/Overview";
import QuickNotes from "./components/overview/QuickNotes";
import UpcomingEvents from "./components/overview/UpcomingEvents";

export function TodayOverviewView() {
  const activeView = useViewStore((s) => s.activeView);
  const isExpanded = useViewStore((s) => s.isExpanded);
  const setIsExpanded = useViewStore((s) => s.setIsExpanded);

  return (
    <div
      className={cn(
        "relative flex shrink-0 transition-all duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-0"
      )}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent active:scale-95"
        aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
      >
        <HugeiconsIcon
          icon={isExpanded ? ArrowRight01Icon : ArrowLeft01Icon}
          size={12}
          className="text-muted-foreground"
        />
      </button>

      {/* Panel content */}
      <div
        className={cn(
          "w-72 h-full border-l border-border bg-sidebar px-5 py-6 overflow-y-auto scrollbar-thin transition-opacity duration-300",
          isExpanded
            ? "opacity-100"
            : "overflow-hidden opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col gap-6">
          {activeView === "matrix" && <Overview />}
          <QuickNotes />
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}
