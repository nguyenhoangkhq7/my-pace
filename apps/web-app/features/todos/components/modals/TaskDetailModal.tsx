"use client";

import { useState } from "react";
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
import { VisuallyHidden } from "radix-ui";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "DOING", label: "Doing" },
  { value: "IN_REVIEW", label: "Review" },
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

interface TaskDetailModalInnerProps {
  task: BoardTask;
  onClose: () => void;
}

function TaskDetailModalInner({ task, onClose }: TaskDetailModalInnerProps) {
  const { categories } = useCategories();
  const { updateTask } = useTasks();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => {
    const currentTask = task as BoardTask & { isImportant?: boolean; energyRequired?: unknown };
    return {
      title: task.title,
      description: task.description ?? "",
      categoryId: task.categoryId ? String(task.categoryId) : "",
      isImportant: Boolean(currentTask.isImportant),
      energyRequired: resolveEnergyValue(currentTask.energyRequired),
      estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
      dueDate: formatInitialDate(task.dueDate),
      status: task.status,
    };
  });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const adjustMinutes = (amount: number) => {
    const current = parseInt(formData.estimatedMinutes) || 0;
    const updated = Math.max(0, current + amount);
    updateField("estimatedMinutes", updated === 0 ? "" : String(updated));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
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
    if (saved) onClose();
    setIsSubmitting(false);
  };

  return (
    <>
      <VisuallyHidden.Root>
        <DialogTitle>Edit Task</DialogTitle>
      </VisuallyHidden.Root>

      {/* Title — prominent input */}
      <div className="px-5 pt-5 pb-3">
        <Input
          autoFocus
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Task name..."
          className={cn(
              "h-auto border-none bg-transparent",
              "px-0 py-0",
              "text-lg font-semibold tracking-tight",
              "text-foreground",
              "placeholder:text-muted-foreground/50",
              "shadow-none",
              "focus-visible:ring-0",
          )}
        />
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 px-5 pb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => updateField("status", opt.value)}
            className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-100",
                formData.status === opt.value
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Metadata section */}
      <div className="border-t border-border px-5 py-4 space-y-3 max-h-[55vh] overflow-y-auto scrollbar-thin">
        {/* Row 1: Category + Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-transparent px-2.5 text-xs text-foreground outline-none transition focus:border-primary"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Due Date</label>
            <Input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => updateField("dueDate", e.target.value)}
              className="h-8 rounded-lg border-border bg-transparent px-2 text-xs text-foreground focus-visible:ring-0 focus:border-primary"
            />
          </div>
        </div>

        {/* Row 2: Energy + Estimate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Energy</label>
            <div className="flex gap-1">
              {ENERGY_OPTIONS.map((level) => {
                const active = formData.energyRequired === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField("energyRequired", active ? "" : level)}
                    className={cn(
                        "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all duration-100",
                        active
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-muted/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {"⚡".repeat(level === "LOW" ? 1 : level === "MEDIUM" ? 2 : 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estimate</label>
            <div className="flex h-8 items-center rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => adjustMinutes(-15)}
                className="px-2 text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-mono h-full transition"
              >
                −
              </button>
              <Input
                type="number"
                min={0}
                step={15}
                value={formData.estimatedMinutes}
                onChange={(e) => updateField("estimatedMinutes", e.target.value)}
                placeholder="min"
                className="h-full border-none bg-transparent text-center text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 shadow-none p-0 w-full"
              />
              <button
                type="button"
                onClick={() => adjustMinutes(15)}
                className="px-2 text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-mono h-full transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Important toggle */}
        <button
          type="button"
          onClick={() => updateField("isImportant", !formData.isImportant)}
          className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg px-3 transition-all duration-100",
              formData.isImportant
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <HugeiconsIcon icon={formData.isImportant ? StarIcon : StarOffIcon} size={14} />
          <span className="text-xs font-medium">Important</span>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider opacity-70">
            {formData.isImportant ? "On" : "Off"}
          </span>
        </button>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Add notes..."
            className="min-h-[60px] resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus:border-primary"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-8 px-3"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || !formData.title.trim()}
          className="h-8 rounded-lg px-5 bg-blue-600 font-semibold text-white hover:bg-blue-500 text-xs transition-all disabled:opacity-40"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  );
}

export function TaskDetailModal() {
  const task = useModalStore((s) => s.taskDetailTask);
  const setTaskDetailTask = useModalStore((s) => s.setTaskDetailTask);
  const handleClose = () => setTaskDetailTask(null);

  return (
    <Dialog open={task !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn(
          "top-[10%]! translate-y-0!",
          "w-[480px]! max-w-[92vw]!",
          "overflow-hidden rounded-2xl",
          "border border-border bg-card p-0",
          "shadow-2xl shadow-black/40",
        )}
      >
        {task && (
          <TaskDetailModalInner
            key={task.id}
            task={task}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}