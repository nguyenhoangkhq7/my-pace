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
    iconColor: "text-slate-400",
    accentColor: "text-slate-400",
  },
];

export function MatrixView() {
  const selectedCategoryId = useCategoryFilterStore((s) => s.selectedCategoryId);
  const setCategory = useCategoryFilterStore((s) => s.setCategory);

  const { tasks } = useTasks();
  const { categories } = useCategories();
  const activeCategoryClasses = "bg-pace-accent/20 text-pace-accent-strong border border-pace-accent/30";

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
          <h2 className="text-xl font-semibold text-pace-text">Eisenhower Matrix View</h2>
        </div>
        <p className="text-sm text-pace-muted italic">Ưu tiên công việc cấp bách và quan trọng.</p>
      </div>
      {/* Category filter pills */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {/* "All" pill */}
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
            selectedCategoryId === null
              ? "bg-pace-border/30 text-pace-text border border-pace-border-strong/50"
              : "bg-transparent border border-pace-border text-pace-muted hover:border-pace-border-strong hover:text-pace-text"
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
                  : "bg-transparent border border-pace-border text-pace-muted hover:border-pace-border-strong hover:text-pace-text"
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
          className="fixed inset-0 bg-pace-bg/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in"
          onClick={() => setActiveTask(null)}
        >
          <div 
            className="bg-pace-sidebar border border-pace-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top row: Category and Close */}
            <div className="flex items-center justify-between">
              {activeTask.category ? (
                <span className="rounded-full bg-pace-card border border-pace-border px-2.5 py-0.5 text-[10px] font-semibold text-pace-text-soft uppercase tracking-wider">
                  {activeTask.category.name}
                </span>
              ) : (
                <span className="text-xs text-pace-muted font-medium">Tóm tắt công việc</span>
              )}
              <button
                onClick={() => setActiveTask(null)}
                className="text-pace-muted hover:text-pace-text transition p-1 hover:bg-pace-card rounded-lg active:scale-90"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-pace-text leading-snug">
                {activeTask.title}
              </h3>
              {activeTask.description ? (
                  <p className="text-xs text-pace-text-soft bg-pace-card/40 rounded-lg p-3 border border-pace-border/40 leading-relaxed whitespace-pre-wrap max-h-30 overflow-y-auto">
                  {activeTask.description}
                </p>
              ) : (
                <p className="text-xs text-pace-muted-soft italic mt-0.5">Không có mô tả chi tiết cho task này.</p>
              )}
            </div>

            {/* Simplified Details Table */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
              <div className="bg-pace-card/30 rounded-xl p-2.5 border border-pace-border/40 flex flex-col gap-1">
                <span className="text-pace-muted-soft font-medium">Trạng thái</span>
                <span className={cn(
                  "font-semibold rounded-md px-1.5 py-0.5 w-fit",
                  activeTask.isDone 
                    ? "bg-pace-success/15 text-pace-success border border-pace-success/20" 
                    : "bg-pace-card text-pace-muted border border-pace-border"
                )}>
                  {activeTask.isDone ? "Đã hoàn thành" : "Chưa hoàn thành"}
                </span>
              </div>

              <div className="bg-pace-card/30 rounded-xl p-2.5 border border-pace-border/40 flex flex-col gap-1">
                <span className="text-pace-muted-soft font-medium">Độ quan trọng</span>
                <span className="text-pace-text-soft font-semibold flex items-center gap-1.5">
                  <span>🎯</span>
                  {activeTask.isImportant ? "Quan trọng" : "Bình thường"}
                </span>
              </div>

              {activeTask.dueDate && (
                <div className="bg-pace-card/30 rounded-xl p-2.5 border border-pace-border/40 flex flex-col gap-1">
                  <span className="text-pace-muted-soft font-medium">Hạn chót</span>
                  <span className="text-pace-text-soft font-semibold flex items-center gap-1.5 truncate">
                    <HugeiconsIcon icon={Calendar01Icon} size={12} className="text-pace-muted shrink-0" />
                    {new Date(activeTask.dueDate).toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}

              {activeTask.estimatedMinutes != null && (
                <div className="bg-pace-card/30 rounded-xl p-2.5 border border-pace-border/40 flex flex-col gap-1">
                  <span className="text-pace-muted-soft font-medium">Thời gian ước tính</span>
                  <span className="text-pace-text-soft font-semibold flex items-center gap-1.5">
                    <HugeiconsIcon icon={Timer01Icon} size={12} className="text-pace-muted" />
                    {activeTask.estimatedMinutes} phút
                  </span>
                </div>
              )}

              <div className="bg-pace-card/30 rounded-xl p-2.5 border border-pace-border/40 flex flex-col gap-1 col-span-2">
                <span className="text-pace-muted-soft font-medium">Mức năng lượng yêu cầu</span>
                <span className="text-pace-text-soft font-semibold flex items-center gap-1.5">
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
                className="flex-1 bg-pace-card hover:bg-pace-card-hover text-pace-text py-2 rounded-xl text-xs font-semibold transition active:scale-95"
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
