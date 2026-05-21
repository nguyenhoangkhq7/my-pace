"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  CircleIcon,
  CheckmarkCircle02Icon,
  PencilEdit01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import type { TaskItem, EnergyLevel } from "@/features/todos/types";
import {
  CATEGORY_BADGE_COLORS,
  ENERGY_LABELS,
  ENERGY_COLORS,
} from "@/features/todos/types";
import { useFilterStore } from "@/stores/filter.store";
import { useTasks } from "@/hooks/useTasks";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDueDate(iso: string): { label: string; overdue: boolean } {
  const due = new Date(iso);
  const now = new Date();

  const hh = due.getHours().toString().padStart(2, "0");
  const mm = due.getMinutes().toString().padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  // Strip time for day comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDay.getTime() === today.getTime()) {
    return { label: `Today, ${timeStr}`, overdue: due.getTime() < now.getTime() };
  }

  const dateStr = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (dueDay.getTime() < today.getTime()) {
    return { label: `${dateStr}, ${timeStr}`, overdue: true };
  }

  return { label: `${dateStr}, ${timeStr}`, overdue: false };
}

// ── Energy Resolver ───────────────────────────────────────────────────────────

function resolveEnergy(val: unknown): EnergyLevel | null {
  const key = String(val ?? "").toUpperCase();

  if (key === "") return null;
  if (key === "LOW" || key === "1") return "LOW";
  if (key === "MEDIUM" || key === "2") return "MEDIUM";
  if (key === "HIGH" || key === "3") return "HIGH";

  return null;
}

function energyRepeat(level: EnergyLevel): number {
  return level === "LOW" ? 1 : level === "MEDIUM" ? 2 : 3;
}

// ── Component ─────────────────────────────────────────────────────────────────

type BoardCardProps = {
  task: TaskItem;
};

export function BoardCard({ task }: BoardCardProps) {
  const { toggleTaskDone, updateTaskTitle } = useTasks();
  const setTaskDetailTask = useFilterStore((s) => s.setTaskDetailTask);

  // ── Resolved values ──
  const cleanEnergy = resolveEnergy(task.energyRequired);
  const isImportant = Boolean(task.isImportant);
  const energyColor = cleanEnergy ? ENERGY_COLORS[cleanEnergy] : null;

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

  // ── Inline title editing ──
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const commitEdit = () => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== task.title) {
      updateTaskTitle(task.id, trimmed);
    } else {
      setEditValue(task.title);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      setEditValue(task.title);
      setIsEditing(false);
    }
  };

  // ── Card click → open detail modal ──
  const handleCardClick = () => {
    if (!isEditing) setTaskDetailTask(task);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative cursor-pointer rounded-xl border-l-[3px] border border-slate-700/60",
        "bg-slate-800/80 shadow-sm transition-all duration-150",
        "hover:border-slate-600/80 hover:bg-slate-800 hover:shadow-md hover:-translate-y-px",
        "p-3",
        isImportant ? "border-l-amber-400" : "border-l-slate-600",
        task.isDone && "opacity-60",
      )}
    >
      {/* ── Edit button (visible on hover) ── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditValue(task.title);
          setIsEditing(true);
        }}
        aria-label="Edit title"
        className={cn(
          "absolute top-2 right-2 rounded-md p-1",
          "text-slate-500 transition-all duration-150",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-slate-700 hover:text-slate-200",
          "active:scale-90",
        )}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
      </button>

      {/* ── Badge row: category + important ── */}
      {(categoryColors || isImportant) && (
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

          {isImportant && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                "bg-amber-500/20 text-amber-200",
              )}
            >
              <HugeiconsIcon icon={StarIcon} size={10} /> Important
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
            task.isDone ? "text-emerald-400" : "text-slate-500 hover:text-slate-300",
          )}
        >
          <HugeiconsIcon
            icon={task.isDone ? CheckmarkCircle02Icon : CircleIcon}
            size={16}
          />
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex-1 min-w-0 bg-slate-700/60 rounded-md px-1.5 py-0.5",
              "text-sm font-medium text-slate-100 leading-5",
              "border border-pace-accent/60 outline-none",
              "focus:border-pace-accent focus:ring-1 focus:ring-pace-accent/30",
            )}
          />
        ) : (
          <p
            className={cn(
              "text-sm font-medium text-slate-100 leading-5 min-w-0 flex-1 wrap-break-word",
              task.isDone && "line-through text-slate-500",
            )}
          >
            {task.title}
          </p>
        )}
      </div>

      {/* ── Energy indicator ── */}
      {cleanEnergy && energyColor && (
        <span
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            energyColor.bg,
            energyColor.text,
          )}
        >
          {"⚡".repeat(energyRepeat(cleanEnergy))} {ENERGY_LABELS[cleanEnergy]}
        </span>
      )}

      {/* ── Footer: due date + time ── */}
      <div className="mt-3">
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
      </div>
    </div>
  );
}
