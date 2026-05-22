"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModalStore } from "../../stores/modal.store";
import type { BoardTask, TaskStatus, UpdateTaskInput } from "../../types/todo.type";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, StarOffIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useCategories } from "../../hooks/useCategories";
import { useTasks } from "../../hooks/useTasks";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "DOING", label: "Doing" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const ENERGY_OPTIONS = ["LOW", "MEDIUM", "HIGH"] as const;
type EnergyOption = (typeof ENERGY_OPTIONS)[number];

function resolveEnergyValue(value: unknown): EnergyOption | "" {
  const raw = String(value ?? "").toUpperCase();
  if (raw === "LOW" || raw === "1") return "LOW";
  if (raw === "MEDIUM" || raw === "2") return "MEDIUM";
  if (raw === "HIGH" || raw === "3") return "HIGH";
  return "";
}

function formatInitialDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function TaskDetailModal() {
  const task = useModalStore((s) => s.taskDetailTask);
  const setTaskDetailTask = useModalStore((s) => s.setTaskDetailTask);
  const { categories } = useCategories();
  const { updateTask } = useTasks();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    isImportant: false,
    energyRequired: "" as EnergyOption | "",
    estimatedMinutes: "",
    dueDate: "",
    status: "TODO" as TaskStatus,
  });

  useEffect(() => {
    if (task) {
      const currentTask = task as BoardTask & { isImportant?: boolean; energyRequired?: unknown };
      setFormData({
        title: task.title,
        description: task.description ?? "",
        categoryId: task.categoryId ? String(task.categoryId) : "",
        isImportant: Boolean(currentTask.isImportant),
        energyRequired: resolveEnergyValue(currentTask.energyRequired),
        estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
        dueDate: formatInitialDate(task.dueDate),
        status: task.status,
      });
    }
  }, [task]);

  const handleClose = () => setTaskDetailTask(null);

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Hàm xử lý tăng giảm 15 phút
  const adjustMinutes = (amount: number) => {
    const current = parseInt(formData.estimatedMinutes) || 0;
    // Đảm bảo không giảm xuống dưới 0
    const updated = Math.max(0, current + amount);
    updateField("estimatedMinutes", updated === 0 ? "" : String(updated));
  };

  const handleSave = async () => {
    if (!task || !formData.title.trim()) return;
    setIsSubmitting(true);

    const payload: UpdateTaskInput = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      isImportant: formData.isImportant,
      energyRequired: formData.energyRequired || null,
      estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      status: formData.status,
      isDone: formData.status === "DONE",
    };

    const saved = await updateTask(task.id, payload);
    if (saved) handleClose();
    setIsSubmitting(false);
  };

  if (!task) return null;

  return (
      <Dialog open={task !== null} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
            key={task.id}
            className={cn(
                "top-[8%]! translate-y-0!",
                "w-[520px]! max-w-[94vw]!", // Thu hẹp từ 760px xuống 520px cho gọn gàng
                "overflow-hidden rounded-2xl",
                "border border-[#1a2a44] bg-[#08101d] p-0",
                "shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
            )}
        >
          {/* Header - Thu nhỏ padding */}
          <div className="border-b border-[#16243b] px-5 py-4">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#f8fbff]">
              Edit Task
            </DialogTitle>
          </div>

          {/* Body - Tối ưu mật độ hiển thị */}
          <div className="space-y-4 px-5 py-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Title */}
            <div className="space-y-2">
              <Input
                  autoFocus
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Untitled task..."
                  className="h-auto border-none bg-transparent px-0 py-0 text-xl font-semibold tracking-tight text-[#f8fbff] placeholder:text-[#5d7395] shadow-none focus-visible:ring-0"
              />

              {/* Status Selector */}
              <div className="flex flex-wrap items-center gap-1">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField("status", opt.value)}
                        className={cn(
                            "rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                            formData.status === opt.value
                                ? "border-[#3f8cff] bg-[#3f8cff]/15 text-[#69a8ff]"
                                : "border-[#1d314f] bg-[#101b2d] text-[#7d93b6] hover:border-[#34507c] hover:text-white"
                        )}
                    >
                      {opt.label}
                    </button>
                ))}
              </div>
            </div>

            <hr className="border-[#16243b]" />

            {/* Grid Metadata - Chuyển sang dạng 2 cột dọc gọn gàng */}
            <div className="grid grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7d93b6]">Category</label>
                  {formData.categoryId && (
                      <button onClick={() => updateField("categoryId", "")} className="text-[10px] text-[#4ea1ff] hover:underline">Clear</button>
                  )}
                </div>
                <select
                    value={formData.categoryId}
                    onChange={(e) => updateField("categoryId", e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#1d314f] bg-[#101b2d] px-2.5 text-xs text-[#f5f7fb] outline-none transition-all focus:border-[#3f8cff]"
                >
                  <option value="">None</option>
                  {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7d93b6]">Due Date</label>
                  {formData.dueDate && (
                      <button onClick={() => updateField("dueDate", "")} className="text-[10px] text-[#4ea1ff] hover:underline">Clear</button>
                  )}
                </div>
                <Input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                    className="h-9 rounded-lg border-[#1d314f] bg-[#101b2d] px-2 text-xs text-[#f5f7fb] focus-visible:ring-0 focus:border-[#3f8cff]"
                />
              </div>

              {/* Energy */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7d93b6]">Energy</label>
                <div className="flex gap-1">
                  {ENERGY_OPTIONS.map((level) => {
                    const active = formData.energyRequired === level;
                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => updateField("energyRequired", active ? "" : level)}
                            className={cn(
                                "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all",
                                active
                                    ? "border-[#3f8cff] bg-[#3f8cff]/15 text-[#69a8ff]"
                                    : "border-[#1d314f] bg-[#101b2d] text-[#7d93b6] hover:border-[#34507c]"
                            )}
                        >
                          {"⚡".repeat(level === "LOW" ? 1 : level === "MEDIUM" ? 2 : 3)}
                        </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimate với cụm nút tăng giảm 15 phút */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7d93b6]">Estimate (mins)</label>
                <div className="flex rounded-lg border border-[#1d314f] bg-[#101b2d] overflow-hidden focus-within:border-[#3f8cff] transition-all">
                  <button
                      type="button"
                      onClick={() => adjustMinutes(-15)}
                      className="px-2.5 text-[#7d93b6] hover:bg-[#16243b] hover:text-white text-sm transition-all font-mono"
                  >
                    -
                  </button>
                  <Input
                      type="number"
                      min={0}
                      step={15}
                      value={formData.estimatedMinutes}
                      onChange={(e) => updateField("estimatedMinutes", e.target.value)}
                      placeholder="0"
                      className="h-8 border-none bg-transparent text-center text-xs text-[#f5f7fb] placeholder:text-[#617089] focus-visible:ring-0 shadow-none p-0 w-full"
                  />
                  <button
                      type="button"
                      onClick={() => adjustMinutes(15)}
                      className="px-2.5 text-[#7d93b6] hover:bg-[#16243b] hover:text-white text-sm transition-all font-mono"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Important Toggle */}
            <button
                type="button"
                onClick={() => updateField("isImportant", !formData.isImportant)}
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-lg border px-3 transition-all",
                    formData.isImportant
                        ? "border-[#ffb84d]/30 bg-[#ffb84d]/8 text-[#ffd27d]"
                        : "border-[#1d314f] bg-[#101b2d] text-[#7d93b6]"
                )}
            >
            <span className="flex items-center gap-1.5 font-medium text-xs">
              <HugeiconsIcon icon={formData.isImportant ? StarIcon : StarOffIcon} size={14} />
              Important Task
            </span>
              <span className="text-[9px] font-bold uppercase tracking-wider">
              {formData.isImportant ? "On" : "Off"}
            </span>
            </button>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7d93b6]">Notes</label>
              <Textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Add notes..."
                  className="min-h-[80px] resize-none rounded-lg border-[#1d314f] bg-[#101b2d] px-3 py-2 text-xs leading-5 text-[#f5f7fb] placeholder:text-[#617089] focus-visible:ring-0 focus:border-[#3f8cff]"
              />
            </div>
          </div>

          {/* Footer - Tiết kiệm không gian */}
          <div className="flex items-center justify-between border-t border-[#16243b] bg-[#08101d] px-5 py-3">
            <p className="text-[10px] text-[#60738f]">Manual save</p>
            <div className="flex items-center gap-2">
              <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-[#7d93b6] hover:bg-[#132238] hover:text-white text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                  onClick={handleSave}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="h-8 rounded-lg px-4 bg-[#4ea1ff] font-semibold text-[#071120] hover:brightness-110 text-xs"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}