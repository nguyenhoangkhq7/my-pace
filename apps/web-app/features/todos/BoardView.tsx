"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BoardColumn } from "./components/board/BoardColumn";
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
  const activeCategoryClasses = "bg-primary/20 text-primary border border-primary/30";

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
              ? "bg-primary/20 text-foreground border border-primary/30"
              : "bg-transparent border border-border text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          All
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setCategory(isActive ? null : cat.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
                isActive
                  ? activeCategoryClasses
                  : "bg-transparent border border-border text-muted-foreground hover:border-border hover:text-foreground",
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
