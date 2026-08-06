"use client";

import { useState, useId } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { taskFormSchema, type TaskFormValues } from "@/features/board/schema/task.schema";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useGoals } from "@/features/board/hooks/useGoals";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";
import { fetchClient, getApiErrorMessage } from "@/lib/fetchClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { TaskFormDuration } from "@/features/board/components/TaskFormDuration";
import { TaskFormCategory } from "@/features/board/components/TaskFormCategory";
import { TaskFormChecklist } from "@/features/board/components/TaskFormChecklist";
import { QuickAddFormDatePicker } from "./QuickAddFormDatePicker";
import type { QuickAddResult } from "../types";
import type { TaskChecklistItem } from "@/features/board/types";
import type { CreateEventPayload } from "@/features/calendar/types";

interface QuickAddFormProps {
  initialData: QuickAddResult;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuickAddForm({ initialData, onSuccess, onCancel }: QuickAddFormProps) {
  const { t } = useTranslation();
  const { createTask, isCreating: isTaskCreating } = useTasks();
  const { categories } = useCategories();
  const { goals } = useGoals();
  const { triggerAutoSchedule } = useAutoSchedule();
  const queryClient = useQueryClient();
  const urgentId = useId();
  const importantId = useId();
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Task state
  const isTask = initialData.type !== "event";

  // Checklists (for task)
  const [localChecklists, setLocalChecklists] = useState<Partial<TaskChecklistItem>[]>(
    (initialData.type === "task" && initialData.checklists)
      ? initialData.checklists.map((c, i) => ({ title: c.title, isCompleted: c.isCompleted, orderIndex: i }))
      : []
  );

  // Event state
  const [eventTitle, setEventTitle] = useState(initialData.title);
  const [eventDateStr, setEventDateStr] = useState(
    initialData.type === "event"
      ? (initialData.eventDate ?? format(new Date(), "yyyy-MM-dd"))
      : format(new Date(), "yyyy-MM-dd")
  );
  const [eventStart, setEventStart] = useState(
    initialData.type === "event" ? (initialData.startTime ?? "09:00") : "09:00"
  );
  const [eventEnd, setEventEnd] = useState(
    initialData.type === "event" ? (initialData.endTime ?? "10:00") : "10:00"
  );
  const [eventCategoryId, setEventCategoryId] = useState<string | undefined>(
    initialData.categoryId ?? undefined
  );
  const [eventNotes, setEventNotes] = useState(initialData.notes ?? "");

  // Task form setup
  const parsedDueDate = (initialData.type === "task" && initialData.dueDate)
    ? new Date(initialData.dueDate)
    : undefined;
  const [dueTime, setDueTime] = useState(
    (initialData.type === "task" && initialData.dueDate?.includes("T"))
      ? initialData.dueDate.split("T")[1].substring(0, 5)
      : "23:59"
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema(false)),
    mode: "onChange",
    defaultValues: {
      title: initialData.title,
      estimatedMinutes: initialData.type === "task" ? (initialData.estimatedMinutes ?? undefined) : undefined,
      notes: initialData.notes ?? "",
      isUrgent: initialData.type === "task" ? initialData.isUrgent : false,
      isImportant: initialData.type === "task" ? initialData.isImportant : false,
      categoryId: initialData.categoryId ?? undefined,
      goalId: (initialData.type === "task" && initialData.goalId) ? initialData.goalId : undefined,
      dueDate: parsedDueDate,
      isSplittable: false,
    },
  });

  const { register, handleSubmit, control, formState } = form;
  const watchGoalId = useWatch({ control, name: "goalId" });
  const associatedGoal = goals.find((g) => g.id === (initialData.type === "task" ? initialData.goalId || watchGoalId : undefined));

  const onSubmitTask = async (values: TaskFormValues) => {
    try {
      await createTask({
        title: values.title,
        estimatedMinutes: values.estimatedMinutes || undefined,
        notes: values.notes || undefined,
        isUrgent: values.isUrgent,
        isImportant: values.isImportant,
        categoryId: values.categoryId === "none" ? undefined : (values.categoryId || undefined),
        goalId: values.goalId === "none" ? undefined : (values.goalId || undefined),
        dueDate: values.dueDate
          ? `${format(values.dueDate, "yyyy-MM-dd")}T${dueTime || "23:59"}:00`
          : undefined,
        isSplittable: false,
        checklists: localChecklists.length > 0 ? localChecklists as TaskChecklistItem[] : undefined,
      });
      onSuccess();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to create task");
      toast.error(msg);
      console.error("Failed to create task:", err);
    }
  };

  const onSubmitEvent = async () => {
    if (!eventTitle.trim()) return;
    setIsSubmittingEvent(true);
    try {
      const payload: CreateEventPayload = {
        title: eventTitle.trim(),
        notes: eventNotes.trim() || undefined,
        startTime: `${eventStart}:00`,
        endTime: `${eventEnd}:00`,
        eventDate: eventDateStr,
        isAllDay: false,
        recurrenceType: "NONE",
        categoryId: eventCategoryId || undefined,
      };
      await fetchClient.post("calendar/events", payload);
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["availableTime"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      triggerAutoSchedule();
      onSuccess();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to create event");
      toast.error(msg);
      console.error("Failed to create event:", err);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  if (!isTask) {
    return (
      <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5" />
          <span>{t.quickAdd.typeEvent}</span>
        </div>

        {/* Event Title */}
        <div className="grid gap-1.5">
          <Label htmlFor="qa-event-title">{t.calendar.titleLabel}</Label>
          <Input
            id="qa-event-title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="bg-card border-border focus:border-primary text-base font-medium"
            autoFocus
          />
        </div>

        {/* Date */}
        <div className="grid gap-1.5">
          <Label htmlFor="qa-event-date">{t.quickAdd.eventDate}</Label>
          <Input
            id="qa-event-date"
            type="date"
            value={eventDateStr}
            onChange={(e) => setEventDateStr(e.target.value)}
            className="bg-card border-border focus:border-primary text-sm"
          />
        </div>

        {/* Start & End Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="qa-event-start">{t.quickAdd.startTime}</Label>
            <Input
              id="qa-event-start"
              type="time"
              value={eventStart}
              onChange={(e) => setEventStart(e.target.value)}
              className="bg-card border-border focus:border-primary text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qa-event-end">{t.quickAdd.endTime}</Label>
            <Input
              id="qa-event-end"
              type="time"
              value={eventEnd}
              onChange={(e) => setEventEnd(e.target.value)}
              className="bg-card border-border focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Category */}
        <TaskFormCategory
          categoryId={eventCategoryId}
          onCategoryChange={setEventCategoryId}
          categories={categories}
        />

        {/* Notes */}
        <div className="grid gap-1.5">
          <Label htmlFor="qa-event-notes">{t.taskForm.notesLabel}</Label>
          <Textarea
            id="qa-event-notes"
            value={eventNotes}
            onChange={(e) => setEventNotes(e.target.value)}
            className="bg-card border-border focus:border-primary min-h-[60px]"
            placeholder={t.taskForm.notesPlaceholder}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-1">
          <Button variant="outline" size="sm" onClick={onCancel} className="border-border text-foreground hover:bg-muted cursor-pointer">
            {t.common.cancel}
          </Button>
          <Button size="sm" onClick={onSubmitEvent} disabled={isSubmittingEvent} className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
            {isSubmittingEvent ? t.quickAdd.creating : `Tạo ${t.quickAdd.typeEvent}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5" />
          <span>{t.quickAdd.typeTask}</span>
        </div>

      {/* Title */}
      <div className="grid gap-1.5">
        <Label htmlFor="qa-title" className={cn(formState.errors.title && "text-red-500")}>
          {t.taskForm.titleLabel}
        </Label>
        <Input
          id="qa-title"
          {...register("title")}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(onSubmitTask)(); }}
          className={cn("bg-card border-border focus:border-primary text-base font-medium", formState.errors.title && "border-red-500")}
          autoFocus
        />
      </div>

      {/* Duration */}
      <Controller
        name="estimatedMinutes"
        control={control}
        render={({ field }) => (
          <TaskFormDuration
            value={field.value ? String(field.value) : ""}
            onChange={(val) => field.onChange(val ? parseInt(val, 10) : undefined)}
          />
        )}
      />

      {/* Due Date */}
      <Controller
        name="dueDate"
        control={control}
        render={({ field }) => (
          <QuickAddFormDatePicker
            date={field.value || undefined}
            onDateChange={field.onChange}
            time={dueTime}
            onTimeChange={setDueTime}
          />
        )}
      />

      {/* Urgency & Importance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Controller name="isUrgent" control={control} render={({ field }) => (
            <Checkbox id={urgentId} checked={!!field.value} onCheckedChange={(c) => field.onChange(c === true)} className="border-border cursor-pointer" />
          )} />
          <Label htmlFor={urgentId} className="cursor-pointer font-normal text-sm select-none">{t.taskForm.urgentLabel}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Controller name="isImportant" control={control} render={({ field }) => (
            <Checkbox id={importantId} checked={!!field.value} onCheckedChange={(c) => field.onChange(c === true)} className="border-border cursor-pointer" />
          )} />
          <Label htmlFor={importantId} className="cursor-pointer font-normal text-sm select-none">{t.taskForm.importantLabel}</Label>
        </div>
      </div>

      {/* Category */}
      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <TaskFormCategory
            categoryId={field.value || undefined}
            onCategoryChange={field.onChange}
            categories={categories}
            goalId={watchGoalId || undefined}
            associatedGoal={associatedGoal}
          />
        )}
      />

      {/* Notes */}
      <div className="grid gap-1.5">
        <Label htmlFor="qa-notes">{t.taskForm.notesLabel}</Label>
        <Textarea
          id="qa-notes"
          {...register("notes")}
          className="bg-card border-border focus:border-primary min-h-[60px]"
          placeholder={t.taskForm.notesPlaceholder}
        />
      </div>

      {/* Checklists */}
      <TaskFormChecklist
        checklists={localChecklists}
        onAddChecklistLocal={(title) => setLocalChecklists((prev) => [...prev, { title, isCompleted: false, orderIndex: prev.length }])}
        onUpdateChecklistLocal={(idx, updates) => setLocalChecklists((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)))}
        onDeleteChecklistLocal={(idx) => setLocalChecklists((prev) => prev.filter((_, i) => i !== idx))}
        onReorderLocal={(src, dest) => {
          setLocalChecklists((prev) => {
            const arr = [...prev]; const [moved] = arr.splice(src, 1); arr.splice(dest, 0, moved);
            return arr.map((item, i) => ({ ...item, orderIndex: i }));
          });
        }}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-1">
        <Button variant="outline" size="sm" onClick={onCancel} className="border-border text-foreground hover:bg-muted cursor-pointer">
          {t.common.cancel}
        </Button>
        <Button size="sm" onClick={handleSubmit(onSubmitTask)} disabled={isTaskCreating} className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
          {isTaskCreating ? t.quickAdd.creating : t.quickAdd.createTask}
        </Button>
      </div>
    </div>
  );
}

