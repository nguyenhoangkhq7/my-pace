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
import { useTodoStore } from "@/stores/todo.store";
import { useFilterStore } from "@/stores/filter.store";
import { appToast } from "@/components/feedback/app-toast";
import type { Priority, EnergyLevel, TaskStatus } from "@/features/todos/types";

// ── Schema ──────────────────────────────────────────────────────────────────

const newTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  categoryId: z.string().optional(),
  priority: z.string(),
  energyRequired: z.string(),
  estimatedMinutes: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

type NewTaskValues = z.infer<typeof newTaskSchema>;

// ── Component ───────────────────────────────────────────────────────────────

type NewTaskFormProps = {
  onSuccess?: () => void;
  onSuccessAction?: () => void;
};

export function NewTaskForm({ onSuccess, onSuccessAction }: NewTaskFormProps) {
  const categories = useTodoStore((s) => s.categories);
  const createTask = useTodoStore((s) => s.createTask);
  const defaultTaskStatus = useFilterStore((s) => s.defaultTaskStatus);
  const handleSuccess = onSuccessAction ?? onSuccess;

  const form = useForm<NewTaskValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: "",
      categoryId: "",
      priority: "2",
      energyRequired: "3",
      estimatedMinutes: "",
      dueDate: "",
      description: "",
      status: defaultTaskStatus || "TODO",
    },
  });

  const status = useWatch({ control: form.control, name: "status" });

  const onSubmit = async (data: NewTaskValues) => {
    try {
      const categoryIdVal = data.categoryId ? parseInt(data.categoryId) : null;
      const priorityVal = parseInt(data.priority);
      const energyRequiredVal = parseInt(data.energyRequired);
      const estimatedMinutesVal = data.estimatedMinutes ? parseInt(data.estimatedMinutes) : null;
      const dueDateVal = data.dueDate ? new Date(data.dueDate).toISOString() : null;

      const payload = {
        title: data.title,
        categoryId: categoryIdVal,
        priority: priorityVal as Priority,
        energyRequired: energyRequiredVal as EnergyLevel,
        estimatedMinutes: estimatedMinutesVal,
        dueDate: dueDateVal,
        description: data.description || undefined,
        status: (data.status || defaultTaskStatus || "TODO") as TaskStatus,
      };

      await createTask(payload);

      appToast.success("Task created", {
        description: `"${data.title}" has been added.`,
      });
      form.reset();
      handleSuccess?.();
    } catch (err: unknown) {
      console.error("Failed to create task:", err);
      appToast.error("Task creation failed", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
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

        {/* ── Right column: Category, Priority, Energy+Est, Due Date ── */}
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
            <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
            <select
              {...form.register("priority")}
              id="task-priority"
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 outline-none transition focus:border-pace-accent"
            >
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
              <option value="4">Urgent</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="task-energy">Energy</FieldLabel>
              <select
                {...form.register("energyRequired")}
                id="task-energy"
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 outline-none transition focus:border-pace-accent"
              >
                <option value="1">⚡ Very Low</option>
                <option value="2">⚡⚡ Low</option>
                <option value="3">⚡⚡⚡ Medium</option>
                <option value="4">⚡⚡⚡⚡ High</option>
                <option value="5">⚡⚡⚡⚡⚡ Intense</option>
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

