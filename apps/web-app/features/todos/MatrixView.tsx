"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Calendar01Icon,
  UserMultipleIcon,
  Delete01Icon,
  Timer01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { BoardTask, MatrixQuadrantType } from "./types/todo.type";
import { useCategoryFilterStore } from "./stores/category-filter.store";
import { useTasks } from "./hooks/useTasks";
import { useCategories } from "./hooks/useCategories";
import { MatrixQuadrant } from "./components/matrix/MatrixQuadrant";

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
    iconColor: "text-muted-foreground",
    accentColor: "text-muted-foreground",
  },
];

export function MatrixView() {
  const selectedCategoryId = useCategoryFilterStore((s) => s.selectedCategoryId);
  const setCategory = useCategoryFilterStore((s) => s.setCategory);

  const { tasks } = useTasks();
  const { categories } = useCategories();
  const activeCategoryClasses = "bg-primary/20 text-primary border border-primary/30";

  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const groupedTasks: Record<MatrixQuadrantType, BoardTask[]> = {
    "do-now": [],
    "schedule": [],
    "delegate": [],
    "eliminate": [],
  };

  const filteredTasks = tasks.filter(
    (t) => selectedCategoryId === null || t.categoryId === selectedCategoryId
  );

  filteredTasks.forEach((task) => {
    const isImportant = task.isImportant;
    let isUrgent = false;

    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const now = new Date();

      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      isUrgent = dueDay.getTime() <= today.getTime();
    }

    if (isImportant && isUrgent) {
      groupedTasks["do-now"].push(task);
    } else if (isImportant && !isUrgent) {
      groupedTasks["schedule"].push(task);
    } else if (!isImportant && isUrgent) {
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
          <h2 className="text-xl font-semibold text-foreground">Eisenhower Matrix View</h2>
        </div>
        <p className="text-sm text-muted-foreground italic">Ưu tiên công việc cấp bách và quan trọng.</p>
      </div>
      {/* Category filter pills */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {/* "All" pill */}
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
            selectedCategoryId === null
              ? "bg-border/30 text-foreground border border-border"
              : "bg-transparent border border-border text-muted-foreground hover:border-border hover:text-foreground"
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
                  : "bg-transparent border border-border text-muted-foreground hover:border-border hover:text-foreground"
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
              onSelectTask={setActiveTask}
            />
          );
        })}
      </div>

      {/* Simplified Task Summary Modal */}
      {activeTask && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in"
          onClick={() => setActiveTask(null)}
        >
          <div 
            className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top row: Category and Close */}
            <div className="flex items-center justify-between">
              {activeTask.category ? (
                <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {activeTask.category.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Tóm tắt công việc</span>
              )}
              <button
                onClick={() => setActiveTask(null)}
                className="text-muted-foreground hover:text-foreground transition p-1 hover:bg-muted rounded-lg active:scale-90"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-foreground leading-snug">
                {activeTask.title}
              </h3>
              {activeTask.description ? (
                  <p className="text-xs text-foreground bg-muted/40 rounded-lg p-3 border border-border/40 leading-relaxed whitespace-pre-wrap max-h-30 overflow-y-auto">
                  {activeTask.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-0.5">Không có mô tả chi tiết cho task này.</p>
              )}
            </div>

            {/* Simplified Details Table */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
              <div className="bg-muted/30 rounded-xl p-2.5 border border-border/40 flex flex-col gap-1">
                <span className="text-muted-foreground font-medium">Trạng thái</span>
                <span className={cn(
                  "font-semibold rounded-md px-1.5 py-0.5 w-fit",
                  activeTask.isDone 
                    ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/50" 
                    : "bg-muted text-muted-foreground border border-border"
                )}>
                  {activeTask.isDone ? "Đã hoàn thành" : "Chưa hoàn thành"}
                </span>
              </div>

              <div className="bg-muted/30 rounded-xl p-2.5 border border-border/40 flex flex-col gap-1">
                <span className="text-muted-foreground font-medium">Độ quan trọng</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <span>🎯</span>
                  {activeTask.isImportant ? "Quan trọng" : "Bình thường"}
                </span>
              </div>

              {activeTask.dueDate && (
                <div className="bg-muted/30 rounded-xl p-2.5 border border-border/40 flex flex-col gap-1">
                  <span className="text-muted-foreground font-medium">Hạn chót</span>
                  <span className="text-foreground font-semibold flex items-center gap-1.5 truncate">
                    <HugeiconsIcon icon={Calendar01Icon} size={12} className="text-muted-foreground shrink-0" />
                    {new Date(activeTask.dueDate).toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}

              {activeTask.estimatedMinutes != null && (
                <div className="bg-muted/30 rounded-xl p-2.5 border border-border/40 flex flex-col gap-1">
                  <span className="text-muted-foreground font-medium">Thời gian ước tính</span>
                  <span className="text-foreground font-semibold flex items-center gap-1.5">
                    <HugeiconsIcon icon={Timer01Icon} size={12} className="text-muted-foreground" />
                    {activeTask.estimatedMinutes} phút
                  </span>
                </div>
              )}

              <div className="bg-muted/30 rounded-xl p-2.5 border border-border/40 flex flex-col gap-1 col-span-2">
                <span className="text-muted-foreground font-medium">Mức năng lượng yêu cầu</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <span>⚡</span>
                  {activeTask.energyRequired === "HIGH" ? "Cao (High)" : 
                   activeTask.energyRequired === "MEDIUM" ? "Trung bình (Medium)" : "Thấp (Low)"}
                </span>
              </div>
            </div>

            {/* Bottom Done toggle / close buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setActiveTask(null)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-xl text-xs font-semibold transition active:scale-95"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
