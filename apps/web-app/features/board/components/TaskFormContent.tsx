import { useState, useEffect, useCallback, useRef } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task, TaskChecklistItem } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useTasks } from "../hooks/useTasks";
import { useCategories } from "../hooks/useCategories";
import { getGoalsAction } from "@/features/goal/actions/goal.action";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import { getApiErrorMessage } from "@/lib/fetchClient";
import { useTranslation } from "@/hooks/use-translation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskFormSchema, TaskFormValues } from "../schema/task.schema";
import { TimeSelect } from "@/components/ui/time-select";

import { TaskFormChecklist } from "./TaskFormChecklist";
import { TaskFormDuration } from "./TaskFormDuration";
import { TaskFormCategory } from "./TaskFormCategory";

interface TaskFormContentProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit?: (task: Partial<Task>) => void;
  initialData?: Partial<Task>;
  requireDuration?: boolean;
  prefilledGoalId?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
  planningTarget?: 'today' | 'tomorrow';
  initialStatus?: 'Icebox' | 'Backlog' | 'Picked for Today' | 'Done';
}

export function TaskFormContent({ 
  isOpen, 
  onOpenChange,
  onClose, 
  onSubmit, 
  initialData, 
  requireDuration,
  prefilledGoalId,
  isUrgent: prefilledUrgent,
  isImportant: prefilledImportant,
  planningTarget,
  initialStatus
}: TaskFormContentProps) {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { categories } = useCategories();

  const { data: goals = [], refetch: fetchGoals } = useQuery({ queryKey: ['goals'], queryFn: getGoalsAction });
  const { t } = useTranslation();

  const [localChecklists, setLocalChecklists] = useState<Partial<TaskChecklistItem>[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  const [dueTime, setDueTime] = useState(() => {
    if (initialData?.dueDate && initialData.dueDate.includes("T")) {
      return initialData.dueDate.split("T")[1].substring(0, 5);
    }
    return "23:59";
  });

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    let nextDueTime = "23:59";
    if (initialData?.dueDate && initialData.dueDate.includes("T")) {
      nextDueTime = initialData.dueDate.split("T")[1].substring(0, 5);
    }
    setDueTime(nextDueTime);
  }

  const currentTask = initialData?.id ? tasks.find(t => t.id === initialData.id) : null;
  const checklists = currentTask?.checklists || [];

  const { register, handleSubmit, control, setValue, reset, watch, formState } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema(!!requireDuration)),
    defaultValues: {
      title: "",
      estimatedMinutes: undefined,
      notes: "",
      isUrgent: false,
      isImportant: false,
      categoryId: undefined,
      goalId: undefined,
      dueDate: undefined,
    }
  });

  const watchRef = useRef(watch);
  useEffect(() => {
    watchRef.current = watch;
  });

  const getInitialValues = useCallback((): TaskFormValues => {
    let initialDueDate: Date | undefined = undefined;
    if (initialData?.dueDate) {
      initialDueDate = new Date(initialData.dueDate);
    } else if (planningTarget) {
      initialDueDate = new Date();
      if (planningTarget === 'tomorrow') initialDueDate.setDate(initialDueDate.getDate() + 1);
    } else if (prefilledGoalId && initialStatus !== 'Icebox' && !initialData?.id) {
      initialDueDate = new Date();
    }

    return {
      title: initialData?.title || "",
      estimatedMinutes: initialData?.estimatedMinutes || undefined,
      notes: initialData?.notes || "",
      isUrgent: prefilledUrgent !== undefined ? prefilledUrgent : (initialData?.isUrgent || false),
      isImportant: prefilledImportant !== undefined ? prefilledImportant : (initialData?.isImportant || false),
      categoryId: initialData?.categoryId || undefined,
      goalId: prefilledGoalId || initialData?.goalId || undefined,
      dueDate: initialDueDate,
    };
  }, [initialData, planningTarget, prefilledGoalId, initialStatus, prefilledUrgent, prefilledImportant]);

  const resetToInitial = () => {
    const initialVals = getInitialValues();
    reset(initialVals);
    const checklistsToUse = initialData?.id ? currentTask?.checklists : initialData?.checklists;
    setLocalChecklists(checklistsToUse
      ? checklistsToUse.map(c => ({ id: c.id, title: c.title, isCompleted: c.isCompleted, orderIndex: c.orderIndex }))
      : []
    );
    setError("");
    localStorage.removeItem('my_pace_task_draft_new');
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchGoals();
    
    Promise.resolve().then(() => {
      setIsConfirmDeleteOpen(false);
      setError("");

      const initialVals = getInitialValues();
      const checklistsToUse = initialData?.id ? currentTask?.checklists : initialData?.checklists;
      setLocalChecklists(checklistsToUse
        ? checklistsToUse.map(c => ({ id: c.id, title: c.title, isCompleted: c.isCompleted, orderIndex: c.orderIndex }))
        : []
      );

      if (!initialData?.id) {
        const savedDraft = localStorage.getItem('my_pace_task_draft_new');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.dueDate) draft.dueDate = new Date(draft.dueDate);
            reset(draft);
            return;
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }
      }

      reset(initialVals);
    });
  }, [isOpen, initialData, fetchGoals, getInitialValues, reset, currentTask]);

  const isChecklistsDirty = JSON.stringify(localChecklists) !== JSON.stringify(
    (initialData?.id ? currentTask?.checklists : initialData?.checklists)?.map(c => ({ id: c.id, title: c.title, isCompleted: c.isCompleted, orderIndex: c.orderIndex })) || []
  );

  const isDirty = formState.isDirty || isChecklistsDirty;

  const hasDraft = !initialData?.id && isDirty;

  useEffect(() => {
    if (!isOpen || !!initialData?.id) return;

    const subscription = watchRef.current((value) => {
      if (isDirty) {
        localStorage.setItem('my_pace_task_draft_new', JSON.stringify({
          ...value,
          localChecklists
        }));
      } else {
        localStorage.removeItem('my_pace_task_draft_new');
      }
    });

    // Handle initial state or clean up
    if (!isDirty) {
      localStorage.removeItem('my_pace_task_draft_new');
    }

    return () => subscription.unsubscribe();
  }, [isDirty, localChecklists, isOpen, initialData]);

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const watchGoalId = useWatch({ control, name: "goalId" });
  const watchTitle = useWatch({ control, name: "title" });
  const watchEstimatedMinutes = useWatch({ control, name: "estimatedMinutes" });

  useEffect(() => {
    if (watchGoalId && watchGoalId !== "none") {
      const selectedGoal = goals.find(g => g.id === watchGoalId);
      if (selectedGoal) {
        Promise.resolve().then(() => {
          if (selectedGoal.categoryId) {
            setValue("categoryId", selectedGoal.categoryId, { shouldDirty: true });
          }
          if (!watchTitle && selectedGoal.goalType === 'Time-boxed') {
            setValue("title", selectedGoal.title, { shouldDirty: true });
          }
          if (!watchEstimatedMinutes && selectedGoal.goalType === 'Time-boxed') {
            setValue("estimatedMinutes", selectedGoal.durationMinutes || 30, { shouldDirty: true });
          }
        });
      }
    }
  }, [watchGoalId, goals, setValue, watchTitle, watchEstimatedMinutes]);

  const handleFormSubmit = async (values: TaskFormValues) => {
    const taskData: Partial<Task> = {
      title: values.title,
      estimatedMinutes: values.estimatedMinutes || undefined,
      notes: values.notes || undefined,
      isUrgent: values.isUrgent,
      isImportant: values.isImportant,
      categoryId: values.categoryId === "none" ? undefined : (values.categoryId || undefined),
      goalId: values.goalId === "none" ? undefined : (values.goalId || undefined),
      dueDate: values.dueDate ? `${format(values.dueDate, "yyyy-MM-dd")}T${dueTime || "23:59"}:00` : undefined,
    };

    if (!initialData?.id && localChecklists.length > 0) {
      taskData.checklists = localChecklists as TaskChecklistItem[];
    }

    if (initialStatus && !initialData?.id) {
      taskData.status = initialStatus;
    }

    try {
      if (onSubmit) {
        await onSubmit(taskData);
      } else {
        if (initialData?.id) {
          await updateTask({ id: initialData.id, data: taskData });
        } else {
          await createTask(taskData);
        }
        handleClose();
      }
      if (!initialData?.id) {
        localStorage.removeItem('my_pace_task_draft_new');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialData?.id) return;
    try {
      await deleteTask(initialData.id);
      localStorage.removeItem('my_pace_task_draft_new');
      setIsConfirmDeleteOpen(false);
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setIsConfirmDeleteOpen(false);
    }
  };

   const associatedGoal = goals.find(g => g.id === (prefilledGoalId || initialData?.goalId || watchGoalId));

  return (
    <>
      <DialogContent className={cn(
        "bg-background text-foreground border-border max-h-[90vh] overflow-y-auto scrollbar-thin",
        requireDuration ? "sm:max-w-[425px]" : "sm:max-w-[840px]"
      )}>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? (requireDuration ? t.taskForm.missingInfo : t.taskForm.editTask) : t.taskForm.createTask}</DialogTitle>
          {requireDuration && (
            <DialogDescription className="text-muted-foreground">
              {t.taskForm.missingDurationDesc}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className={cn("grid py-4", requireDuration ? "gap-4" : "grid-cols-1 md:grid-cols-2 gap-6")}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className={cn(formState.errors.title && "text-red-500")}>
                {t.taskForm.titleLabel}
              </Label>
              <Input
                id="title"
                {...register("title")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(handleFormSubmit)();
                }}
                className={cn(
                  "bg-card border-border focus:border-primary text-lg font-medium",
                  formState.errors.title && "border-red-500 focus:border-red-500"
                )}
                disabled={requireDuration && !!initialData?.title}
              />
              {formState.errors.title && (
                <p className="text-red-500 text-xs">{formState.errors.title.message}</p>
              )}
            </div>
            
            {!requireDuration && (
              initialData?.id ? (
                <TaskFormChecklist taskId={initialData.id} checklists={checklists} />
              ) : (
                <TaskFormChecklist 
                  checklists={localChecklists} 
                  onAddChecklistLocal={(title) => setLocalChecklists(prev => [...prev, { title, isCompleted: false, orderIndex: prev.length }])}
                  onUpdateChecklistLocal={(index, updates) => setLocalChecklists(prev => prev.map((item, idx) => idx === index ? { ...item, ...updates } : item))}
                  onDeleteChecklistLocal={(index) => setLocalChecklists(prev => prev.filter((_, idx) => idx !== index))}
                  onReorderLocal={(sourceIndex, destIndex) => {
                    setLocalChecklists(prev => {
                       const newOrder = [...prev];
                       const [moved] = newOrder.splice(sourceIndex, 1);
                       newOrder.splice(destIndex, 0, moved);
                       return newOrder.map((item, idx) => ({ ...item, orderIndex: idx }));
                    });
                  }}
                />
              )
            )}
            
            {!requireDuration && (
              <div className="grid gap-2 pt-2">
                <Label htmlFor="notes">{t.taskForm.notesLabel}</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  className="bg-card border-border focus:border-primary min-h-[100px]"
                  placeholder={t.taskForm.notesPlaceholder}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!requireDuration && !prefilledGoalId && (
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
            )}

            {!requireDuration && associatedGoal && prefilledGoalId && (
              <div className="grid gap-2 mt-4">
                <Label>{t.taskForm.goalLabel}</Label>
                <div className="p-2.5 bg-card border border-border rounded-md text-sm text-foreground font-medium">
                  {associatedGoal.title}
                </div>
              </div>
            )}

            {!requireDuration && (
              <div className="grid gap-2">
                <Label>{t.taskForm.dueDateLabel}</Label>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal bg-card border-border",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>{t.taskForm.pickDate}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-popover border-border">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              className="text-foreground"
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {field.value && (
                        <>
                          <div className="w-[140px]">
                            <TimeSelect
                              value={dueTime}
                              onChange={setDueTime}
                              size="sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              field.onChange(undefined);
                              setDueTime("23:59");
                            }}
                            className="h-9 w-9 text-muted-foreground hover:text-red-400 cursor-pointer shrink-0"
                            title="Xóa ngày giờ"
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
            
            <Controller
              name="estimatedMinutes"
              control={control}
              render={({ field }) => (
                <div className="grid gap-2">
                  <TaskFormDuration 
                    value={field.value ? String(field.value) : ""}
                    onChange={(val) => field.onChange(val ? parseInt(val, 10) : undefined)}
                    requireDuration={requireDuration}
                  />
                  {formState.errors.estimatedMinutes && (
                    <p className="text-red-500 text-xs">{formState.errors.estimatedMinutes.message}</p>
                  )}
                </div>
              )}
            />
            
            {!requireDuration && !prefilledGoalId && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isUrgent"
                    control={control}
                    render={({ field }) => (
                      <Checkbox 
                        id="urgent" 
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        className="border-border"
                      />
                    )}
                  />
                  <Label htmlFor="urgent" className="cursor-pointer font-normal text-sm">{t.taskForm.urgentLabel}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isImportant"
                    control={control}
                    render={({ field }) => (
                      <Checkbox 
                        id="important" 
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        className="border-border"
                      />
                    )}
                  />
                  <Label htmlFor="important" className="cursor-pointer font-normal text-sm">{t.taskForm.importantLabel}</Label>
                </div>
              </div>
            )}
          </div>
          
          {error && <p className="text-red-500 text-sm md:col-span-3">{error}</p>}
        </div>
        
        <DialogFooter className="mt-2 flex flex-row items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            {!requireDuration && initialData?.id && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 font-medium gap-1 px-2 h-9 cursor-pointer"
              >
                <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                {t.taskForm.deleteTask}
              </Button>
            )}
            {!requireDuration && !initialData?.id && hasDraft && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetToInitial}
                className="text-muted-foreground hover:bg-muted font-medium gap-1 px-2 h-9 cursor-pointer"
                title="Khôi phục"
              >
                Khôi phục
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="border-border text-foreground hover:bg-muted">
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit(handleFormSubmit)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {requireDuration ? t.taskForm.continue : t.taskForm.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      
      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title={t.taskForm.confirmDeleteTitle}
        description={t.taskForm.confirmDeleteDesc}
      />
    </>
  );
}
