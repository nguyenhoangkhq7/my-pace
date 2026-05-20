"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import TodayOverview from "./TodayOverview";
import QuickNotes from "./QuickNotes";
import UpcomingEvents from "./UpcomingEvents";

export function RightPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

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
        onClick={() => setIsExpanded((prev) => !prev)}
        className="absolute -left-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 transition hover:bg-slate-700 active:scale-95"
        aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
      >
        <HugeiconsIcon
          icon={isExpanded ? ArrowRight01Icon : ArrowLeft01Icon}
          size={12}
          className="text-slate-400"
        />
      </button>

      {/* Panel content */}
      <div
        className={cn(
          "w-72 h-full border-l border-slate-800 bg-pace-sidebar px-5 py-6 overflow-y-auto scrollbar-thin transition-opacity duration-300",
          isExpanded
            ? "opacity-100"
            : "overflow-hidden opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col gap-6">
          <TodayOverview />
          <QuickNotes />
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}
