"use client";

import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { Flag, Loader2 } from "lucide-react";
import type { QuickAddResult } from "../types";

interface QuickAddResultHeaderProps {
  result: QuickAddResult | null;
  isReporting: boolean;
  onReportError: () => void;
  onToggleType: () => void;
}

export function QuickAddResultHeader({
  result,
  isReporting,
  onReportError,
  onToggleType,
}: QuickAddResultHeaderProps) {
  const { t } = useTranslation();
  const isTask = result?.type === "task";

  return (
    <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/40 bg-muted/15 rounded-t-xl">
      {/* Left: Mode Badge & Report Action */}
      <div className="flex items-center gap-2">
        <span className="text-primary text-xs font-medium tracking-tight select-none">
          {t.quickAdd.aiParsed || "AI đã trích xuất"}
        </span>

        {/* Refined Report Button */}
        <button
          type="button"
          onClick={() => onReportError()}
          disabled={isReporting}
          title={t.quickAdd.report || "Báo lỗi"}
          className={cn(
            "group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight",
            "text-muted-foreground/80 hover:text-rose-500 bg-muted/40 hover:bg-rose-500/10 border border-border/50 hover:border-rose-500/30",
            "transition-all duration-150 cursor-pointer select-none active:scale-[0.98]",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isReporting && "opacity-80 cursor-wait bg-muted/60"
          )}
        >
          {isReporting ? (
            <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
          ) : (
            <Flag className="h-3 w-3 text-muted-foreground group-hover:text-rose-500 transition-colors" />
          )}
          <span>{isReporting ? t.quickAdd.reporting : t.quickAdd.report}</span>
        </button>
      </div>

      {/* Right: Type Toggle Switcher */}
      <div className="flex items-center rounded-lg bg-muted/60 p-0.5 text-xs font-medium border border-border/50">
        <button
          type="button"
          onClick={() => !isTask && onToggleType()}
          className={cn(
            "px-2.5 py-0.5 rounded-md transition-all cursor-pointer text-xs font-medium",
            isTask
              ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.quickAdd.typeTask}
        </button>
        <button
          type="button"
          onClick={() => isTask && onToggleType()}
          className={cn(
            "px-2.5 py-0.5 rounded-md transition-all cursor-pointer text-xs font-medium",
            !isTask
              ? "bg-background text-foreground font-semibold shadow-xs border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.quickAdd.typeEvent}
        </button>
      </div>
    </div>
  );
}
