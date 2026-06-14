"use client";

import { useMemo, useState, useRef, useEffect } from "react";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Calendar01Icon,
  CircleIcon,
  CheckmarkCircle02Icon,
  PencilEdit01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

import {
  BoardTask,
  ENERGY_COLORS,
  ENERGY_LABELS,
  EnergyLevel,
} from "../../types/todo.type";

import { useModalStore } from "../../stores/modal.store";
import { useTasks } from "../../hooks/useTasks";

function formatDueDate(iso: string): {
  label: string;
  overdue: boolean;
} {
  const due = new Date(iso);
  const now = new Date();

  const hh = due.getHours().toString().padStart(2, "0");
  const mm = due.getMinutes().toString().padStart(2, "0");

  const dueDay = new Date(
      due.getFullYear(),
      due.getMonth(),
      due.getDate(),
  );

  const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
  );

  const timeStr = `${hh}:${mm}`;

  if (dueDay.getTime() === today.getTime()) {
    return {
      label: `Today, ${timeStr}`,
      overdue: due.getTime() < now.getTime(),
    };
  }

  const dateStr = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    label: `${dateStr}, ${timeStr}`,
    overdue: due.getTime() < now.getTime(),
  };
}

function resolveEnergy(val: unknown): EnergyLevel | null {
  const key = String(val ?? "").toUpperCase();

  if (key === "LOW" || key === "1") return "LOW";
  if (key === "MEDIUM" || key === "2") return "MEDIUM";
  if (key === "HIGH" || key === "3") return "HIGH";

  return null;
}

type BoardCardProps = {
  task: BoardTask;
};

export function TaskCard({ task }: BoardCardProps) {
  const { toggleTaskDone, updateTaskTitle } = useTasks();

  const setTaskDetailTask = useModalStore(
      (s) => s.setTaskDetailTask,
  );

  const cleanEnergy = resolveEnergy(task.energyRequired);

  const isImportant = Boolean(task.isImportant);

  const energyColor = cleanEnergy
      ? ENERGY_COLORS[cleanEnergy]
      : null;

  const categoryBadgeClasses = "bg-primary/20 text-primary border border-primary/20";

  const dueMeta = useMemo(
      () => (task.dueDate ? formatDueDate(task.dueDate) : null),
      [task.dueDate],
  );

  const [isEditing, setIsEditing] = useState(false);

  const [editValue, setEditValue] = useState(task.title);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
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

  const handleCardClick = () => {
    if (!isEditing) {
      setTaskDetailTask(task);
    }
  };

  const showUrgent =
      isImportant && cleanEnergy === "HIGH";

  return (
      <div
          onClick={handleCardClick}
          className={cn(
              "group relative cursor-pointer",
              "rounded-2xl border-l-2",
              "border border-border",
              "bg-linear-to-b from-card/90 to-card",
              "p-3",
              "shadow-[0_4px_20px_rgba(0,0,0,0.25)]",
              "transition-all duration-200",
              "hover:-translate-y-px",
              "hover:border-border",
              "hover:shadow-[0_10px_25px_rgba(0,0,0,0.35)]",
              showUrgent
                  ? "border-l-rose-800"
                  : "border-l-border",
              task.isDone && "opacity-50",
          )}
      >
        {/* Edit button */}
        <button
            onClick={(e) => {
              e.stopPropagation();
              setEditValue(task.title);
              setIsEditing(true);
            }}
            className={cn(
                "absolute right-2.5 top-2.5 z-10 rounded-md p-1",
                "text-muted-foreground",
                "opacity-0 transition-all duration-150",
                "group-hover:opacity-100",
                "hover:bg-border",
                "hover:text-foreground",
            )}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
        </button>

        {/* Category */}
        {task.category && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span
              className={cn(
                  "rounded-full px-2 py-0.5",
                  "text-[9px] font-semibold uppercase tracking-wider",
                  categoryBadgeClasses,
              )}
          >
            {task.category.name}
          </span>
            </div>
        )}

        {/* Title row */}
        <div className="flex items-start gap-2.5">
          <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskDone(task.id, !task.isDone);
              }}
              className={cn(
                  "mt-0.5 shrink-0 transition-all",
                  task.isDone
                      ? "text-emerald-400"
                      : "text-muted-foreground hover:text-foreground",
              )}
          >
            <HugeiconsIcon
                icon={
                  task.isDone
                      ? CheckmarkCircle02Icon
                      : CircleIcon
                }
                size={16}
            />
          </button>

          {isEditing ? (
              <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) =>
                      setEditValue(e.target.value)
                  }
                  onBlur={commitEdit}
                  className={cn(
                      "flex-1 rounded-lg",
                      "border border-primary/60",
                      "bg-background",
                      "px-2 py-1",
                      "text-sm text-foreground",
                      "outline-none",
                  )}
              />
          ) : (
              <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "wrap-break-word text-sm font-medium leading-5",
                        "text-foreground",
                        task.isDone &&
                        "text-muted-foreground line-through",
                    )}
                >
                  {task.title}

                  {!task.isDone && isImportant && (
                      <span className="ml-1.5 inline-flex align-middle text-rose-400">
                  <HugeiconsIcon
                      icon={AlertCircleIcon}
                      size={13}
                  />
                </span>
                  )}
                </p>
              </div>
          )}
        </div>

        {/* Footer */}
        {(cleanEnergy || dueMeta) && (
            <div
                className={cn(
                    "mt-3 flex items-center justify-between",
                    "border-t border-border",
                    "pt-2 text-[10.5px]",
                )}
            >
              <div className="flex items-center gap-2">
                {dueMeta && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 font-medium",
                            dueMeta.overdue
                                ? "text-rose-400"
                                : "text-muted-foreground",
                        )}
                    >
                <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={11}
                />

                      {dueMeta.label}
              </span>
                )}

                {cleanEnergy && energyColor && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1",
                            "text-[9px] font-semibold uppercase tracking-wider",
                            energyColor.text,
                        )}
                    >
                ⚡ {ENERGY_LABELS[cleanEnergy]}
              </span>
                )}
              </div>
            </div>
        )}
      </div>
  );
}