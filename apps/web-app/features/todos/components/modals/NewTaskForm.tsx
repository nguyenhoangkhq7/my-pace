"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useModalStore } from "../../stores/modal.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, StarOffIcon } from "@hugeicons/core-free-icons";
import type { EnergyLevel, TaskStatus, CreateTaskInput } from "../../types/todo.type";
import { useCategories } from "../../hooks/useCategories";
import { useTasks } from "../../hooks/useTasks";

const ENERGY_OPTIONS = ["LOW", "MEDIUM", "HIGH"] as const;

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "DOING", label: "Doing" },
  { value: "IN_REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
];

const newTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  categoryId: z.string().optional(),
  isImportant: z.boolean(),
  energyRequired: z.union([z.enum(["LOW", "MEDIUM", "HIGH"]), z.literal("")]),
  estimatedMinutes: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

type NewTaskValues = z.infer<typeof newTaskSchema>;

type NewTaskFormProps = {
  onSuccessAction?: () => void;
};

export function NewTaskForm({ onSuccessAction }: NewTaskFormProps) {
  const { categories } = useCategories();
  const { createTask } = useTasks();
  const defaultTaskStatus = useModalStore((s) => s.defaultTaskStatus);

  const form = useForm<NewTaskValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      isImportant: false,
      energyRequired: "",
      estimatedMinutes: "",
      dueDate: "",
      description: "",
      status: defaultTaskStatus || "TODO",
    },
  });

  const status = useWatch({ control: form.control, name: "status" });
  const isImportant = useWatch({ control: form.control, name: "isImportant" });
  const energyRequired = useWatch({ control: form.control, name: "energyRequired" });
  const estimatedMinutes = useWatch({ control: form.control, name: "estimatedMinutes" });

  // Bộ tăng giảm thời gian nhảy 15 phút
  const adjustMinutes = (amount: number) => {
    const current = parseInt(estimatedMinutes || "0") || 0;
    const updated = Math.max(0, current + amount);
    form.setValue("estimatedMinutes", updated === 0 ? "" : String(updated), { shouldDirty: true });
  };

  const onSubmit = async (data: NewTaskValues) => {
    const categoryIdVal = data.categoryId ? parseInt(data.categoryId) : null;
    const estimatedMinutesVal = data.estimatedMinutes ? parseInt(data.estimatedMinutes) : null;
    const dueDateVal = data.dueDate ? new Date(data.dueDate).toISOString() : null;

    const payload: CreateTaskInput = {
      title: data.title,
      categoryId: categoryIdVal,
      isImportant: data.isImportant,
      energyRequired: data.energyRequired === "" ? null : (data.energyRequired as EnergyLevel),
      estimatedMinutes: estimatedMinutesVal,
      dueDate: dueDateVal,
      description: data.description || null,
      status: (data.status || defaultTaskStatus || "TODO") as TaskStatus,
    };

    const created = await createTask(payload);
    if (created) {
      form.reset();
      onSuccessAction?.();
    }
  };

  return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        {/* Title — prominent input */}
        <div className="px-5 pt-5 pb-3">
          <Input
              {...form.register("title")}
              autoFocus
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
          {form.formState.errors.title?.message && (
              <p className="mt-1.5 text-[11px] font-medium text-red-400">
                {form.formState.errors.title.message}
              </p>
          )}
        </div>

        {/* Status pills — compact row */}
        <div className="flex items-center gap-1.5 px-5 pb-4">
          {STATUS_OPTIONS.map((opt) => (
              <button
                  key={opt.value}
                  type="button"
                  onClick={() => form.setValue("status", opt.value)}
                  className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-100",
                      status === opt.value
                          ? "bg-blue-500/15 text-blue-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
              >
                {opt.label}
              </button>
          ))}
        </div>

        {/* Metadata section */}
        <div className="border-t border-border px-5 py-4 space-y-3">
          {/* Row 1: Category + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <select
                  {...form.register("categoryId")}
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
                  {...form.register("dueDate")}
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
                  const active = energyRequired === level;
                  return (
                      <button
                          key={level}
                          type="button"
                          onClick={() => form.setValue("energyRequired", active ? "" : level)}
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
                    {...form.register("estimatedMinutes")}
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

          {/* Important toggle — inline */}
          <button
              type="button"
              onClick={() => form.setValue("isImportant", !isImportant)}
              className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-lg px-3 transition-all duration-100",
                  isImportant
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
          >
            <HugeiconsIcon icon={isImportant ? StarIcon : StarOffIcon} size={14} />
            <span className="text-xs font-medium">Important</span>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider opacity-70">
              {isImportant ? "On" : "Off"}
            </span>
          </button>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
            <Textarea
                {...form.register("description")}
                placeholder="Add notes..."
                className="min-h-[60px] resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus:border-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-9 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500 active:scale-[0.98] text-xs transition-all disabled:opacity-40"
          >
            {form.formState.isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
  );
}