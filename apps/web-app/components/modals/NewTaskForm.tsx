"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Priority, EnergyLevel } from "@/features/todos/types";

// ── Schema ──────────────────────────────────────────────────────────────────

const newTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  categoryId: z.string().optional(),
  priority: z.string(),
  energyRequired: z.string(),
  estimatedMinutes: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

type NewTaskValues = z.infer<typeof newTaskSchema>;

// ── Component ───────────────────────────────────────────────────────────────

type NewTaskFormProps = {
  onSuccess: () => void;
};

export function NewTaskForm({ onSuccess }: NewTaskFormProps) {
  const categories = useTodoStore((s) => s.categories);
  const createTask = useTodoStore((s) => s.createTask);
  const defaultTaskStatus = useFilterStore((s) => s.defaultTaskStatus);

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
    },
  });

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
        status: defaultTaskStatus || "TODO",
      };

      await createTask(payload);

      appToast.success("Task created", {
        description: `"${data.title}" has been added.`,
      });
      form.reset();
      onSuccess();
    } catch (err: any) {
      console.error("Failed to create task:", err);
      appToast.error("Task creation failed", {
        description: err.message || "Something went wrong.",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FieldGroup className="space-y-4">
        {/* Title */}
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

        {/* Category & Priority row */}
        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Energy & Estimated Time row */}
        <div className="grid grid-cols-2 gap-3">
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="task-energy">Energy Required</FieldLabel>
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
              Est. Time <span className="text-slate-500 font-normal">(min)</span>
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

        {/* Due Date */}
        <Field className="space-y-1.5">
          <FieldLabel htmlFor="task-due">Due Date</FieldLabel>
          <Input
            {...form.register("dueDate")}
            id="task-due"
            type="datetime-local"
            className="h-10 rounded-lg bg-slate-800 border-slate-700 text-slate-100 focus:border-pace-accent [color-scheme:dark]"
          />
        </Field>

        {/* Description */}
        <Field className="space-y-1.5">
          <FieldLabel htmlFor="task-description">
            Description <span className="text-slate-500 font-normal">(optional)</span>
          </FieldLabel>
          <Textarea
            {...form.register("description")}
            id="task-description"
            placeholder="Add more details..."
            className="min-h-[70px] resize-none rounded-lg bg-slate-800 border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:border-pace-accent"
          />
        </Field>
      </FieldGroup>

      {/* Submit */}
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

