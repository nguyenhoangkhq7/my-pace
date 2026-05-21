"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useFilterStore } from "@/stores/filter.store";
import type {
  EnergyLevel,
  Priority,
  TaskItem,
  TaskStatus,
} from "@/features/todos/types";
import {
  PRIORITY_LABELS,
  ENERGY_LABELS,
} from "@/features/todos/types";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { useTasks } from "@/hooks/useTasks";
import type { UpdateTaskInput } from "@/services/todo.service";

// ── Status display config ────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "DOING", label: "Doing" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function TaskDetailModal() {
  const task = useFilterStore((s) => s.taskDetailTask);
  const setTaskDetailTask = useFilterStore((s) => s.setTaskDetailTask);

  const isOpen = task !== null;

  const handleClose = (open: boolean) => {
    if (!open) setTaskDetailTask(null);
  };

  if (!task) {
    return <Dialog open={false} onOpenChange={handleClose} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <TaskDetailModalContent
        key={task.id}
        task={task}
        onClose={() => setTaskDetailTask(null)}
      />
    </Dialog>
  );
}

type TaskDetailModalContentProps = {
  task: TaskItem;
  onClose: () => void;
};

function TaskDetailModalContent({ task, onClose }: TaskDetailModalContentProps) {
  const { categories } = useCategories();
  const { updateTask } = useTasks();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [categoryId, setCategoryId] = useState(
    task.categoryId ? String(task.categoryId) : "",
  );
  const [priority, setPriority] = useState(String(task.priority ?? 2));
  const [energyRequired, setEnergyRequired] = useState(
    String(task.energyRequired ?? 3),
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimatedMinutes ? String(task.estimatedMinutes) : "",
  );
  const [dueDate, setDueDate] = useState(() => {
    if (!task.dueDate) return "";

    const d = new Date(task.dueDate);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    const payload: UpdateTaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      priority: parseInt(priority) as Priority,
      energyRequired: parseInt(energyRequired) as EnergyLevel,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status,
      isDone: status === "DONE",
    };

    const saved = await updateTask(task.id, payload);

    if (saved) {
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
      <DialogContent className="top-[8%]! translate-y-0! w-[60vw]! max-w-none! border-slate-800 bg-pace-sidebar p-0 shadow-2xl">
      <DialogHeader className="px-6 pt-6 pb-2">
        <DialogTitle className="text-lg font-semibold text-slate-100">
          Task Details
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-400">
          View and update task information.
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 pb-6">
        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-2 gap-6">
          {/* ── Left column: Title, Status, Description ── */}
          <FieldGroup className="space-y-4">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="detail-title">Title</FieldLabel>
              <Input
                id="detail-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="h-10 rounded-lg border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
              />
            </Field>

            <Field className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                      status === opt.value
                        ? "bg-pace-accent text-slate-950 shadow-sm"
                        : "border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field className="flex-1 space-y-1.5">
              <FieldLabel htmlFor="detail-description">
                Description <span className="font-normal text-slate-500">(optional)</span>
              </FieldLabel>
              <Textarea
                id="detail-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details…"
                className="min-h-30 resize-none rounded-lg border-slate-700 bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
              />
            </Field>
          </FieldGroup>

          {/* ── Right column: Category, Priority, Energy, Est Time, Due Date ── */}
          <FieldGroup className="space-y-4">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="detail-category">Category</FieldLabel>
              <select
                id="detail-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
              <FieldLabel htmlFor="detail-priority">Priority</FieldLabel>
              <select
                id="detail-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 outline-none transition focus:border-pace-accent"
              >
                {([1, 2, 3, 4] as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field className="space-y-1.5">
                <FieldLabel htmlFor="detail-energy">Energy</FieldLabel>
                <select
                  id="detail-energy"
                  value={energyRequired}
                  onChange={(e) => setEnergyRequired(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-300 outline-none transition focus:border-pace-accent"
                >
                  {([1, 2, 3, 4, 5] as EnergyLevel[]).map((e) => (
                    <option key={e} value={e}>
                      {"⚡".repeat(e)} {ENERGY_LABELS[e]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field className="space-y-1.5">
                <FieldLabel htmlFor="detail-estimate">
                  Est. <span className="font-normal text-slate-500">(min)</span>
                </FieldLabel>
                <Input
                  id="detail-estimate"
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="e.g. 30"
                  className="h-10 rounded-lg border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
                />
              </Field>
            </div>

            <Field className="space-y-1.5">
              <FieldLabel htmlFor="detail-due">Due Date</FieldLabel>
              <Input
                id="detail-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-lg border-slate-700 bg-slate-800 text-slate-100 focus:border-pace-accent scheme-dark"
              />
            </Field>
          </FieldGroup>
        </div>

        {/* ── Save button (full width) ── */}
        <Button
          onClick={handleSave}
          disabled={isSubmitting || !title.trim()}
          className={cn(
            "mt-5 h-10 w-full rounded-lg bg-pace-accent font-semibold text-slate-950",
            "transition hover:brightness-110 active:scale-[0.98]",
          )}
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </DialogContent>
  );
}
