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
  const activeCategoryClasses = "bg-blue-500/20 text-blue-200 border border-blue-500/40";

  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const groupedTasks: Record<MatrixQuadrantType, BoardTask[]> = {
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

          return (
            <button
              key={cat.id}
              onClick={() => setCategory(isActive ? null : cat.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition",
                isActive
                  ? activeCategoryClasses
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
              onSelectTask={setActiveTask}
            />
          );
        })}
      </div>

      {/* Simplified Task Summary Modal */}
      {activeTask && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in"
          onClick={() => setActiveTask(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top row: Category and Close */}
            <div className="flex items-center justify-between">
              {activeTask.category ? (
                <span className="rounded-full bg-slate-800 border border-slate-700/60 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  {activeTask.category.name}
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-medium">Tóm tắt công việc</span>
              )}
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-500 hover:text-slate-300 transition p-1 hover:bg-slate-800 rounded-lg active:scale-90"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-slate-100 leading-snug">
                {activeTask.title}
              </h3>
              {activeTask.description ? (
                  <p className="text-xs text-slate-400 bg-slate-850/40 rounded-lg p-3 border border-slate-800/40 leading-relaxed whitespace-pre-wrap max-h-30 overflow-y-auto">
                  {activeTask.description}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic mt-0.5">Không có mô tả chi tiết cho task này.</p>
              )}
            </div>

            {/* Simplified Details Table */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
              <div className="bg-slate-800/30 rounded-xl p-2.5 border border-slate-800/40 flex flex-col gap-1">
                <span className="text-slate-500 font-medium">Trạng thái</span>
                <span className={cn(
                  "font-semibold rounded-md px-1.5 py-0.5 w-fit",
                  activeTask.isDone 
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" 
                    : "bg-slate-800 text-slate-400 border border-slate-700/50"
                )}>
                  {activeTask.isDone ? "Đã hoàn thành" : "Chưa hoàn thành"}
                </span>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-2.5 border border-slate-800/40 flex flex-col gap-1">
                <span className="text-slate-500 font-medium">Độ quan trọng</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <span>🎯</span>
                  {activeTask.isImportant ? "Quan trọng" : "Bình thường"}
                </span>
              </div>

              {activeTask.dueDate && (
                <div className="bg-slate-800/30 rounded-xl p-2.5 border border-slate-800/40 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Hạn chót</span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5 truncate">
                    <HugeiconsIcon icon={Calendar01Icon} size={12} className="text-slate-400 shrink-0" />
                    {new Date(activeTask.dueDate).toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}

              {activeTask.estimatedMinutes != null && (
                <div className="bg-slate-800/30 rounded-xl p-2.5 border border-slate-800/40 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Thời gian ước tính</span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <HugeiconsIcon icon={Timer01Icon} size={12} className="text-slate-400" />
                    {activeTask.estimatedMinutes} phút
                  </span>
                </div>
              )}

              <div className="bg-slate-800/30 rounded-xl p-2.5 border border-slate-800/40 flex flex-col gap-1 col-span-2">
                <span className="text-slate-500 font-medium">Mức năng lượng yêu cầu</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
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
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
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
