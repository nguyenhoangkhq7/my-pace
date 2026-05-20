"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, CircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { TaskItem, Priority, EnergyLevel } from "@/features/todos/types";
import {
  PRIORITY_COLORS,
  CATEGORY_BADGE_COLORS,
  ENERGY_LABELS,
} from "@/features/todos/types";
import { useTodoStore } from "@/stores/todo.store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDueDate(iso: string): { label: string; overdue: boolean } {
  const due = new Date(iso);
  const now = new Date();

  // Strip time for day comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDay.getTime() === today.getTime()) {
    return { label: "Today", overdue: due.getTime() < now.getTime() };
  }

  if (dueDay.getTime() < today.getTime()) {
    return {
      label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      overdue: true,
    };
  }

  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

type BoardCardProps = {
  task: TaskItem;
};

export function BoardCard({ task }: BoardCardProps) {
  const toggleTaskDone = useTodoStore((s) => s.toggleTaskDone);

  // Robust parsing to handle numeric, string, enum-name, and null/undefined values for Priority
  const priorityMap: Record<string | number, Priority> = {
    "1": 1, "LOW": 1, "low": 1,
    "2": 2, "MEDIUM": 2, "medium": 2,
    "3": 3, "HIGH": 3, "high": 3,
    "4": 4, "URGENT": 4, "urgent": 4,
  };

  const cleanPriority = (
    typeof task.priority === "number"
      ? task.priority
      : task.priority
        ? priorityMap[String(task.priority).toUpperCase()] || 2
        : 2
  ) as Priority;

  const priorityColor = PRIORITY_COLORS[cleanPriority] ?? PRIORITY_COLORS[2];

  // Robust parsing for EnergyLevel
  const energyMap: Record<string | number, EnergyLevel> = {
    "1": 1, "VERY_LOW": 1, "very_low": 1,
    "2": 2, "LOW": 2, "low": 2,
    "3": 3, "MEDIUM": 3, "medium": 3,
    "4": 4, "HIGH": 4, "high": 4,
    "5": 5, "INTENSE": 5, "intense": 5,
  };

  const cleanEnergy = (
    typeof task.energyRequired === "number"
      ? task.energyRequired
      : task.energyRequired
        ? energyMap[String(task.energyRequired).toUpperCase()] || 3
        : 3
  ) as EnergyLevel;

  const categoryColors = task.category
    ? CATEGORY_BADGE_COLORS[task.category.name] ?? {
        bg: "bg-slate-500/20",
        text: "text-slate-300",
      }
    : null;

  const dueMeta = useMemo(
    () => (task.dueDate ? formatDueDate(task.dueDate) : null),
    [task.dueDate],
  );

  const showHighBadge = cleanPriority >= 3;
  const isUrgent = cleanPriority === 4;

  return (
    <div
      className={cn(
        "group rounded-xl border-l-[3px] border border-slate-700/60",
        "bg-slate-800/80 shadow-sm transition-all duration-150",
        "hover:border-slate-600/80 hover:bg-slate-800 hover:shadow-md hover:-translate-y-px",
        "p-3",
        priorityColor.border,
        task.isDone && "opacity-60",
      )}
    >
      {/* ── Badge row: category + priority ── */}
      {(categoryColors || showHighBadge) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryColors && task.category && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                categoryColors.bg,
                categoryColors.text,
              )}
            >
              {task.category.name}
            </span>
          )}

          {showHighBadge && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isUrgent
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-amber-500/20 text-amber-200",
              )}
            >
              {isUrgent ? "URGENT" : "HIGH"}
            </span>
          )}
        </div>
      )}

      {/* ── Checkbox + Title ── */}
      <div className="flex items-start gap-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskDone(task.id, !task.isDone);
          }}
          aria-label={task.isDone ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "mt-0.5 shrink-0 transition-all duration-150 hover:scale-110 active:scale-95",
            task.isDone ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <HugeiconsIcon
            icon={task.isDone ? CheckmarkCircle02Icon : CircleIcon}
            size={16}
          />
        </button>
        <p
          className={cn(
            "text-sm font-medium text-slate-100 leading-5 min-w-0 flex-1 break-words",
            task.isDone && "line-through text-slate-500",
          )}
        >
          {task.title}
        </p>
      </div>

      {/* ── Energy indicator ── */}
      {cleanEnergy >= 4 && (
        <span className="mt-1.5 inline-block text-[9px] text-slate-500">
          ⚡ {ENERGY_LABELS[cleanEnergy]}
        </span>
      )}

      {/* ── Footer: due date + avatar ── */}
      <div className="mt-3 flex items-center justify-between">
        {/* Due date */}
        {dueMeta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              dueMeta.overdue ? "text-rose-400" : "text-slate-400",
            )}
          >
            <HugeiconsIcon icon={Calendar01Icon} size={12} />
            {dueMeta.label}
          </span>
        ) : (
          <span />
        )}

        {/* Avatar placeholder */}
        <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400" />
      </div>
    </div>
  );
}
