"use client";

import { cn } from "@/lib/utils";
import type { BoardTask } from "../../types/todo.type";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useTasks } from "../../hooks/useTasks";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return `Today, ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────

type MatrixTaskItemProps = {
  task: BoardTask;
  onSelectTask?: () => void;
};

export function MatrixTaskItem({ task, onSelectTask }: MatrixTaskItemProps) {
  const { toggleTaskDone } = useTasks();

  const done = task.isDone;
  const categoryBadgeClasses = "bg-pace-accent/20 text-pace-accent-strong border border-pace-accent/20";

  const categoryName = task.category?.name ?? null;

  const subtitle = task.dueDate
    ? formatDueDate(task.dueDate)
    : task.description
      ? task.description.slice(0, 40)
      : null;

  return (
    <div
      onClick={onSelectTask}
      className={cn(
        "flex items-start gap-2 rounded-lg px-2 py-2 transition cursor-pointer",
        "hover:bg-pace-card-hover/50",
        done && "opacity-50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleTaskDone(task.id, !done);
        }}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "mt-0.5 shrink-0 transition-all duration-150 hover:scale-110 active:scale-95",
          done ? "text-pace-success" : "text-pace-muted hover:text-pace-text"
        )}
      >
        <HugeiconsIcon
          icon={done ? CheckmarkCircle02Icon : CircleIcon}
          size={16}
        />
      </button>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm text-pace-text leading-5 truncate",
            done && "line-through text-pace-muted"
          )}
        >
          {task.title}
        </p>

        {subtitle && (
          <p className="text-xs text-pace-muted mt-0.5 truncate pl-0.5">{subtitle}</p>
        )}
      </div>

      {/* Category badge */}
      {categoryName && (
        <span
          className={cn(
            "shrink-0 self-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            categoryBadgeClasses
          )}
        >
          {categoryName}
        </span>
      )}
    </div>
  );
}
