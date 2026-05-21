"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Calendar01Icon,
  UserMultipleIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { useFilterStore } from "@/stores/filter.store";
import type { MatrixQuadrantType, TaskItem } from "@/features/todos/types";
import { MatrixQuadrant } from "./MatrixQuadrant";
import { CATEGORY_BADGE_COLORS } from "@/features/todos/types";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";

const QUADRANTS: {
  key: MatrixQuadrantType;
  title: string;
  iconComponent: typeof AlertCircleIcon;
  iconColor: string;
  accentColor: string;
}[] = [
  {
    key: "do-now",
    title: "Do Now",
    iconComponent: AlertCircleIcon,
    iconColor: "text-rose-400",
    accentColor: "text-rose-400",
  },
  {
    key: "schedule",
    title: "Schedule",
    iconComponent: Calendar01Icon,
    iconColor: "text-amber-400",
    accentColor: "text-amber-400",
  },
  {
    key: "delegate",
    title: "Delegate",
    iconComponent: UserMultipleIcon,
    iconColor: "text-blue-400",
    accentColor: "text-blue-400",
  },
  {
    key: "eliminate",
    title: "Eliminate",
    iconComponent: Delete01Icon,
    iconColor: "text-slate-400",
    accentColor: "text-slate-400",
  },
];

export function MatrixView() {
  const selectedCategoryId = useFilterStore((s) => s.selectedCategoryId);
  const setCategory = useFilterStore((s) => s.setCategory);

  const { tasks } = useTasks();
  const { categories } = useCategories();

  const groupedTasks: Record<MatrixQuadrantType, TaskItem[]> = {
    "do-now": [],
    "schedule": [],
    "delegate": [],
    "eliminate": [],
  };

  // filter task theo độ khó và độ ưu tiên (tính cấp bách cần làm)
  // do-now đối với
  const filteredTasks = tasks.filter(
    (t) => selectedCategoryId === null || t.categoryId === selectedCategoryId
  );

  filteredTasks.forEach((task) => {
    const isHighPriority = task.priority >= 3;
    let isUrgent = false;

    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const now = new Date();

      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      isUrgent = dueDay.getTime() <= today.getTime();
    }

    if (isHighPriority && isUrgent) {
      groupedTasks["do-now"].push(task);
    } else if (isHighPriority && !isUrgent) {
      groupedTasks["schedule"].push(task);
    } else if (!isHighPriority && isUrgent) {
      groupedTasks["delegate"].push(task);
    } else {
      groupedTasks["eliminate"].push(task);
    }
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header row */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Eisenhower Matrix View</h2>
        </div>
        <p className="text-sm text-slate-400 italic">Ưu tiên công việc cấp bách và quan trọng.</p>
      </div>
      {/* Category filter pills */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {/* "All" pill */}
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
            selectedCategoryId === null
              ? "bg-slate-500/20 text-slate-100 border border-slate-400/40"
              : "bg-transparent border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
          )}
        >
          All
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id;
          const colors = CATEGORY_BADGE_COLORS[cat.name] ?? {
            bg: "bg-slate-500/20",
            text: "text-slate-300",
          };

          // Derive border color from the bg class — e.g. "bg-blue-500/20" → "border-blue-500/40"
          const borderColor = colors.bg
            .replace("bg-", "border-")
            .replace("/20", "/40");

          return (
            <button
              key={cat.id}
              onClick={() => setCategory(isActive ? null : cat.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
                isActive
                  ? cn(colors.bg, colors.text, "border", borderColor)
                  : "bg-transparent border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-4 mt-5">
        {QUADRANTS.map((q) => {
          return (
            <MatrixQuadrant
              key={q.key}
              title={q.title}
              icon={
                <HugeiconsIcon
                  icon={q.iconComponent}
                  size={16}
                  className={q.iconColor}
                />
              }
              accentColor={q.accentColor}
              tasks={groupedTasks[q.key]}
            />
          );
        })}
      </div>
    </div>
  );
}
