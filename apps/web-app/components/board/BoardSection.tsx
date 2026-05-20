"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { useFilterStore } from "@/stores/filter.store";
import { useTodoStore } from "@/stores/todo.store";
import { BoardColumn } from "@/components/board/BoardColumn";
import { CATEGORY_BADGE_COLORS } from "@/features/todos/types";

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "TODO", title: "To Do" },
  { key: "DOING", title: "Doing" },
  { key: "IN_REVIEW", title: "In Review" },
  { key: "DONE", title: "Done" },
] as const;

// ── Avatar gradients for the stacked avatars ─────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-blue-400 to-cyan-400",
  "from-violet-400 to-fuchsia-400",
  "from-emerald-400 to-teal-400",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function BoardSection() {
  const selectedCategoryId = useFilterStore((s) => s.selectedCategoryId);
  const setCategory = useFilterStore((s) => s.setCategory);

  const tasks = useTodoStore((s) => s.tasks);
  const categories = useTodoStore((s) => s.categories);

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
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-semibold text-slate-100">
            Board Management
          </h2>
          <button
            aria-label="Favourite board"
            className="text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            <HugeiconsIcon icon={FavouriteIcon} size={18} />
          </button>
        </div>

        {/* Stacked avatars */}
        <div className="flex items-center">
          {AVATAR_GRADIENTS.map((gradient, i) => (
            <div
              key={i}
              className={cn(
                "h-7 w-7 rounded-full border-2 border-slate-900 bg-gradient-to-br",
                gradient,
                i > 0 && "-ml-2",
              )}
            />
          ))}
        </div>
      </div>

      {/* ── Subtitle ── */}
      <p className="text-sm text-slate-400 mt-1">Project Zenith Alpha</p>

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
      <div className="mt-5 flex items-stretch gap-5 overflow-x-auto pb-4 flex-1 min-h-0">
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
