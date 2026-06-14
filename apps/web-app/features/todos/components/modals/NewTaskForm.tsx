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
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const dueDate = useWatch({ control: form.control, name: "dueDate" });

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div className="space-y-3">
          {/* Title Input */}
          <div
              className={cn(
                  "rounded-2xl border border-transparent",
                  "bg-pace-bg",
                  "px-4 py-3",
                  "transition-all duration-200",
                  "focus-within:border-pace-accent",
                  "focus-within:bg-pace-sidebar",
                  "focus-within:shadow-[0_0_0_3px_rgba(78,161,255,0.12)]",
              )}
          >
            <Input
                {...form.register("title")}
                placeholder="Untitled task..."
                className={cn(
                    "h-auto border-none bg-transparent",
                    "px-0 py-0",
                    "text-[22px] font-semibold tracking-tight",
                    "text-pace-text",
                    "placeholder:text-pace-muted-soft",
                    "shadow-none",
                    "focus-visible:ring-0",
                )}
            />

            {form.formState.errors.title?.message && (
                <p className="mt-2 text-[11px] font-medium text-red-400">
                  {form.formState.errors.title.message}
                </p>
            )}
          </div>

          {/* Status Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {(["TODO", "DOING", "IN_REVIEW", "DONE"] as const).map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => form.setValue("status", s)}
                    className={cn(
                        "rounded-xl border px-3 py-1.5",
                        "text-[11px] font-semibold uppercase tracking-wider",
                        "transition-all duration-150",
                        "active:scale-[0.97]",

                        status === s
                            ? "border-pace-accent bg-pace-accent/15 text-pace-accent shadow-[0_0_0_1px_rgba(78,161,255,0.25)]"
                            : "border-pace-border bg-pace-bg text-pace-muted hover:border-pace-border-strong hover:bg-pace-card hover:text-pace-text"
                    )}
                >
                  {s === "IN_REVIEW"
                      ? "In Review"
                      : s === "TODO"
                          ? "To Do"
                          : s === "DOING"
                              ? "Doing"
                              : "Done"}
                </button>
            ))}
          </div>
        </div>

        <hr className="border-pace-border" />

        {/* Grid Metadata (2 cột dọc) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Category */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">Category</label>
              {categoryId && (
                  <button type="button" onClick={() => form.setValue("categoryId", "")} className="text-[10px] text-pace-accent hover:underline">Clear</button>
              )}
            </div>
            <select
                {...form.register("categoryId")}
                className="h-9 w-full rounded-lg border border-pace-border bg-pace-bg px-2.5 text-xs text-pace-text outline-none transition-all focus:border-pace-accent"
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">Due Date</label>
              {dueDate && (
                  <button type="button" onClick={() => form.setValue("dueDate", "")} className="text-[10px] text-pace-accent hover:underline">Clear</button>
              )}
            </div>
            <Input
                type="datetime-local"
                {...form.register("dueDate")}
                className="h-9 rounded-lg border-pace-border bg-pace-bg px-2 text-xs text-pace-text focus-visible:ring-0 focus:border-pace-accent"
            />
          </div>

          {/* Energy Button Options */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">Energy</label>
            <div className="flex gap-1">
              {ENERGY_OPTIONS.map((level) => {
                const active = energyRequired === level;
                return (
                    <button
                        key={level}
                        type="button"
                        onClick={() => form.setValue("energyRequired", active ? "" : level)}
                        className={cn(
                            "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all",
                            active
                                ? "border-pace-accent bg-pace-accent/15 text-pace-accent"
                                : "border-pace-border bg-pace-bg text-pace-muted hover:border-pace-border-strong"
                        )}
                    >
                      {"⚡".repeat(level === "LOW" ? 1 : level === "MEDIUM" ? 2 : 3)}
                    </button>
                );
              })}
            </div>
          </div>

          {/* Estimate Input (+/- 15 mins) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">Estimate (mins)</label>
            <div className="flex rounded-lg border border-pace-border bg-pace-bg overflow-hidden focus-within:border-pace-accent transition-all">
              <button
                  type="button"
                  onClick={() => adjustMinutes(-15)}
                  className="px-2.5 text-pace-muted hover:bg-pace-card hover:text-pace-text text-sm transition-all font-mono"
              >
                -
              </button>
              <Input
                  type="number"
                  min={0}
                  step={15}
                  {...form.register("estimatedMinutes")}
                  placeholder="0"
                  className="h-8 border-none bg-transparent text-center text-xs text-pace-text placeholder:text-pace-muted-soft focus-visible:ring-0 shadow-none p-0 w-full"
              />
              <button
                  type="button"
                  onClick={() => adjustMinutes(15)}
                  className="px-2.5 text-pace-muted hover:bg-pace-card hover:text-pace-text text-sm transition-all font-mono"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Important Toggle */}
        <button
            type="button"
            onClick={() => form.setValue("isImportant", !isImportant)}
            className={cn(
                "flex h-9 w-full items-center justify-between rounded-lg border px-3 transition-all",
                isImportant
                    ? "border-pace-warning/30 bg-pace-warning/8 text-pace-warning"
                    : "border-pace-border bg-pace-bg text-pace-muted"
            )}
        >
        <span className="flex items-center gap-1.5 font-medium text-xs">
          <HugeiconsIcon icon={isImportant ? StarIcon : StarOffIcon} size={14} />
          Important Task
        </span>
          <span className="text-[9px] font-bold uppercase tracking-wider">
          {isImportant ? "On" : "Off"}
        </span>
        </button>

        {/* Description / Notes */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">Notes</label>
          <Textarea
              {...form.register("description")}
              placeholder="Add notes..."
              className="min-h-[80px] resize-none rounded-lg border-pace-border bg-pace-bg px-3 py-2 text-xs leading-5 text-pace-text placeholder:text-pace-muted-soft focus-visible:ring-0 focus:border-pace-accent"
          />
        </div>

        {/* Submit Button */}
        <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-9 w-full rounded-lg bg-pace-accent font-semibold text-slate-950 hover:brightness-110 active:scale-[0.98] text-xs transition-all"
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </form>
  );
}