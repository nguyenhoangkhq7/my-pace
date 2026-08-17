"use client";

import React from "react";
import { DailyPlanTask } from "@/features/board/types";

interface UnscheduledTaskItemProps {
  pt: DailyPlanTask;
}

export function UnscheduledTaskItem({ pt }: UnscheduledTaskItemProps) {
  const catColor = pt.task.category?.color;
  const accentColor = catColor || (pt.isMit ? "#6366f1" : null);

  const formatShortTime = (minutes: number) => {
    const m = Math.max(0, minutes);
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0 && min > 0) return `${h}h${min}p`;
    if (h > 0) return `${h}h`;
    return `${min}p`;
  };

  return (
    <div
      data-task-id={pt.task.id}
      data-duration={pt.task.estimatedMinutes || 60}
      data-title={pt.task.title}
      data-mit={String(pt.isMit)}
      data-color={accentColor || ""}
      className="p-2 rounded-lg border border-border bg-card/50 text-card-foreground text-xs select-none transition-all cursor-grab active:cursor-grabbing hover:brightness-110"
      style={
        accentColor
          ? {
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}40`,
              color: accentColor,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-1">
        {pt.isMit && (
          <span
            className="text-[9px] px-1 py-0.5 rounded font-semibold shrink-0"
            style={
              accentColor
                ? { backgroundColor: `${accentColor}30`, color: accentColor }
                : { backgroundColor: "#6366f130", color: "#6366f1" }
            }
          >
            MIT
          </span>
        )}
        <span className="font-medium line-clamp-2 leading-snug">{pt.task.title}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] opacity-75">
        {pt.task.estimatedMinutes > 0 && (
          pt.task.actualMinutes && pt.task.actualMinutes > 0 ? (
            <span className="font-mono font-semibold">
              {formatShortTime(pt.task.actualMinutes)} / {formatShortTime(pt.task.estimatedMinutes)}
            </span>
          ) : (
            <span className="font-mono">{formatShortTime(pt.task.estimatedMinutes)}</span>
          )
        )}
        {pt.task.category && !pt.isMit && (
          <span style={{ color: catColor, opacity: 1 }}>{pt.task.category.name}</span>
        )}
      </div>
    </div>
  );
}
