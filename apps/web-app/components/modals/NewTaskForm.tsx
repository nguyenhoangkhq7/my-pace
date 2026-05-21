"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useModalStore } from "@/stores/modal.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon, StarOffIcon } from "@hugeicons/core-free-icons";
import type { EnergyLevel, TaskStatus } from "@/features/todos/types";
import { useCategories } from "@/hooks/useCategories";
import { useTasks } from "@/hooks/useTasks";
import type { CreateTaskInput } from "@/services/todo.service";

// ── Schema ──────────────────────────────────────────────────────────────────

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

// ── Component ───────────────────────────────────────────────────────────────

type NewTaskFormProps = {
  onSuccessAction?: () => void;
};

export function NewTaskForm({ onSuccessAction }: NewTaskFormProps) {
  const { categories } = useCategories();
  const { createTask } = useTasks();
  const defaultTaskStatus = useModalStore((s) => s.defaultTaskStatus);
  const handleSuccess = onSuccessAction;

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
      handleSuccess?.();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* ── Left column: Title, Status, Description ── */}
        <FieldGroup className="space-y-4">
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="task-title">Title</FieldLabel>
            <Input
              {...form.register("title")}
              id="task-title"
              placeholder="What needs to be done?"
              className="h-10 rounded-lg bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
            />
            <FieldError>{form.formState.errors.title?.message}</FieldError>
          </Field>

          <Field className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {(["TODO", "DOING", "IN_REVIEW", "DONE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => form.setValue("status", s)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    status === s
                      ? "bg-pace-accent text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200",
                  )}
                >
                  {s === "IN_REVIEW" ? "In Review" : s === "TODO" ? "To Do" : s === "DOING" ? "Doing" : "Done"}
                </button>
              ))}
            </div>
          </Field>

          <Field className="space-y-1.5 flex-1">
            <FieldLabel htmlFor="task-description">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </FieldLabel>
            <Textarea
              {...form.register("description")}
              id="task-description"
              placeholder="Add more details…"
              className="min-h-30 resize-none rounded-lg border-slate-700 bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
            />
          </Field>
        </FieldGroup>

        {/* ── Right column: Category, Important, Energy, Est, Due Date ── */}
        <FieldGroup className="space-y-4">
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="task-category">Category</FieldLabel>
            <select
              {...form.register("categoryId")}
              id="task-category"
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 outline-none transition focus:border-pace-accent"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>

          <Field className="space-y-1.5">
            <FieldLabel>Important</FieldLabel>
            <button
              type="button"
              onClick={() => form.setValue("isImportant", !isImportant, { shouldDirty: true })}
              aria-pressed={isImportant}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm font-medium transition",
                "hover:bg-slate-800 hover:text-slate-100 active:scale-[0.98]",
                isImportant
                  ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600",
              )}
            >
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={isImportant ? StarIcon : StarOffIcon} size={16} />
                <span>Important</span>
              </span>
              <span className="text-xs uppercase tracking-wide">
                {isImportant ? "On" : "Off"}
              </span>
            </button>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="task-energy">Energy</FieldLabel>
              <select
                {...form.register("energyRequired")}
                id="task-energy"
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 outline-none transition focus:border-pace-accent"
              >
                <option value="">None</option>
                <option value="LOW">⚡ Low</option>
                <option value="MEDIUM">⚡⚡ Medium</option>
                <option value="HIGH">⚡⚡⚡ High</option>
              </select>
            </Field>

            <Field className="space-y-1.5">
              <FieldLabel htmlFor="task-estimate">
                Est. <span className="text-slate-500 font-normal">(min)</span>
              </FieldLabel>
              <Input
                {...form.register("estimatedMinutes")}
                id="task-estimate"
                type="number"
                min={1}
                placeholder="e.g. 30"
                className="h-10 rounded-lg bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
              />
            </Field>
          </div>

          <Field className="space-y-1.5">
            <FieldLabel htmlFor="task-due">Due Date</FieldLabel>
            <Input
              {...form.register("dueDate")}
              id="task-due"
              type="datetime-local"
              className="h-10 rounded-lg border-slate-700 bg-slate-800 text-slate-100 focus:border-pace-accent scheme-dark"
            />
          </Field>
        </FieldGroup>
      </div>

      {/* Submit (full width) */}
      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-10 w-full rounded-lg bg-pace-accent font-semibold text-slate-950 transition hover:brightness-110 active:scale-[0.98]"
      >
        {form.formState.isSubmitting ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}

