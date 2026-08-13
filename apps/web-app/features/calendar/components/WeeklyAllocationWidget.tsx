"use client";

import { useWeeklyAllocation } from "../hooks/useWeeklyAllocation";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function WeeklyAllocationWidget() {
  const { data: summary, isLoading } = useWeeklyAllocation();

  if (isLoading) {
    return <div className="h-3 w-full bg-muted/20 animate-pulse rounded-full mb-4 mt-2 px-1" />;
  }

  if (!summary) return null;

  const total = summary.totalAvailableMinutes || 1;
  
  const categorySegments = summary.byCategory.map((cat) => ({
    key: cat.categoryId || 'uncategorized',
    label: cat.categoryName,
    color: cat.categoryColor,
    minutes: cat.scheduledMinutes,
    pct: (cat.scheduledMinutes / total) * 100,
  }));

  const bufferPct = (summary.bufferMinutes / total) * 100;
  const freePct = (summary.freeMinutes / total) * 100;

  const formatHours = (mins: number) => Math.round(mins / 60 * 10) / 10 + "h";

  return (
    <div className="w-full flex flex-col gap-2 mb-4 px-1">
      <div className="flex items-center gap-3">
        {/* Progress Bar */}
        <div className="h-3 w-full flex rounded-full overflow-hidden bg-transparent">
          {categorySegments.map((seg) => (
            seg.minutes > 0 && (
              <div
                key={seg.key}
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                className="h-full transition-all duration-300 border-r border-background/20 last:border-0"
              />
            )
          ))}
          
          {summary.bufferMinutes > 0 && (
            <div
              className="h-full bg-slate-200 dark:bg-slate-700 transition-all duration-300 border-r border-background/20 last:border-0"
              style={{ width: `${bufferPct}%` }}
            />
          )}
          
          {summary.freeMinutes > 0 && (
            <div
              className="h-full transition-all duration-300 bg-muted/20"
              style={{ 
                  width: `${freePct}%`, 
                  backgroundImage: 'repeating-linear-gradient(-45deg, hsl(var(--muted)) 0, hsl(var(--muted)) 4px, transparent 4px, transparent 8px)'
              }}
            />
          )}
        </div>

        {/* Info Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors outline-none">
                <Info className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent align="end" className="max-w-[250px]">
              <p>Tổng thời gian khả dụng tuần này: <b>{formatHours(total)}</b>. Lịch trình sẽ được tự động xếp vào quỹ thời gian này.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {categorySegments.map((seg) => (
          seg.minutes > 0 && (
            <div key={seg.key} className="flex items-center gap-1.5 text-[13px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="font-medium text-foreground">{seg.label}</span>
              <span className="text-muted-foreground">{formatHours(seg.minutes)}</span>
            </div>
          )
        ))}
        {summary.bufferMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="font-medium text-foreground">Dự phòng</span>
            <span className="text-muted-foreground">{formatHours(summary.bufferMinutes)}</span>
          </div>
        )}
        {summary.freeMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-muted-foreground/30 bg-muted/10" />
            <span className="font-medium text-foreground">Free</span>
            <span className="text-muted-foreground">{formatHours(summary.freeMinutes)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
