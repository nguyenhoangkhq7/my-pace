"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BoardColumn } from "./components/board/BoardColumn";
import { CATEGORY_BADGE_COLORS } from "./types/todo.type";
import { useTasks } from "./hooks/useTasks";
import { useCategories } from "./hooks/useCategories";
import { useCategoryFilterStore } from "./stores/category-filter.store";

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "TODO", title: "To Do" },
  { key: "DOING", title: "Doing" },
  { key: "IN_REVIEW", title: "In Review" },
  { key: "DONE", title: "Done" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function BoardView() {
  const selectedCategoryId = useCategoryFilterStore((s) => s.selectedCategoryId);
  const setCategory = useCategoryFilterStore((s) => s.setCategory);

  const { tasks } = useTasks();
  const { categories } = useCategories();

  // Filter tasks per column by selected category
  const filteredColumns = useMemo(() => {
    return COLUMNS.map((col) => {
      const allTasks = tasks.filter((t) => t.status === col.key);
      const matchedTasks =
        selectedCategoryId === null
          ? allTasks
          : allTasks.filter((t) => t.categoryId === selectedCategoryId);
      return { ...col, tasks: matchedTasks, count: matchedTasks.length };
    });
  }, [tasks, selectedCategoryId]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Category filter pills ── */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {/* "All" pill */}
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
            selectedCategoryId === null
              ? "bg-slate-500/20 text-slate-100 border border-slate-400/40"
              : "bg-transparent border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200",
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
                  : "bg-transparent border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200",
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ── Columns container ── */}
      <div className="mt-5 flex items-start gap-5 overflow-x-auto pb-4">
        {filteredColumns.map((col) => (
          <BoardColumn
            key={col.key}
            status={col.key}
            title={col.title}
            tasks={col.tasks}
            count={col.count}
          />
        ))}
      </div>
    </div>
  );
}
