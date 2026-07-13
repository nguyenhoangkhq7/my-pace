import { useState, useEffect, useCallback } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task, TaskChecklistItem } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useBoardStore } from "../store/board.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import { getApiErrorMessage } from "@/lib/fetchClient";
import { useTranslation } from "@/hooks/use-translation";

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
  const { tasks, categories, createTask, updateTask, deleteTask } = useBoardStore();
  const { goals, fetchGoals } = useGoalStore();
  const { t } = useTranslation();
  
  const [title, setTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState("");

  const [localChecklists, setLocalChecklists] = useState<Partial<TaskChecklistItem>[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const currentTask = initialData?.id ? tasks.find(t => t.id === initialData.id) : null;
  const checklists = currentTask?.checklists || [];

  const getInitialState = useCallback(() => {
    let initialDueDate: Date | undefined = undefined;
    if (initialData?.dueDate) {
      initialDueDate = new Date(initialData.dueDate);
    } else if (planningTarget) {
      initialDueDate = new Date();
      if (planningTarget === 'tomorrow') initialDueDate.setDate(initialDueDate.getDate() + 1);
    } else if (prefilledGoalId && initialStatus !== 'Icebox' && !initialData?.id) {
      initialDueDate = new Date();
    }

    const checklistsToUse = initialData?.id ? currentTask?.checklists : initialData?.checklists;

    return {
      title: initialData?.title || "",
      estimatedMinutes: initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : "",
      notes: initialData?.notes || "",
      isUrgent: prefilledUrgent !== undefined ? prefilledUrgent : (initialData?.isUrgent || false),
      isImportant: prefilledImportant !== undefined ? prefilledImportant : (initialData?.isImportant || false),
      categoryId: initialData?.categoryId || undefined,
      goalId: prefilledGoalId || initialData?.goalId || undefined,
      dueDate: initialDueDate,
      localChecklists: checklistsToUse
        ? checklistsToUse.map(c => ({ id: c.id, title: c.title, isCompleted: c.isCompleted, orderIndex: c.orderIndex }))
        : []
    };
  }, [initialData, planningTarget, prefilledGoalId, initialStatus, currentTask, prefilledUrgent, prefilledImportant]);

  const resetToInitial = () => {
    const initialState = getInitialState();
    setTitle(initialState.title);
    setEstimatedMinutes(initialState.estimatedMinutes);
    setNotes(initialState.notes);
    setIsUrgent(initialState.isUrgent);
    setIsImportant(initialState.isImportant);
    setCategoryId(initialState.categoryId);
    setGoalId(initialState.goalId);
    setDueDate(initialState.dueDate);
    setLocalChecklists(initialState.localChecklists);
    setError("");
    localStorage.removeItem('my_pace_task_draft_new');
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchGoals();
    
    Promise.resolve().then(() => {
      setIsConfirmDeleteOpen(false);
      setError("");

      if (!initialData?.id) {
        const savedDraft = localStorage.getItem('my_pace_task_draft_new');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            setTitle(draft.title || "");
            setEstimatedMinutes(draft.estimatedMinutes || "");
            setNotes(draft.notes || "");
            setIsUrgent(draft.isUrgent ?? false);
            setIsImportant(draft.isImportant ?? false);
            setCategoryId(draft.categoryId);
            setGoalId(draft.goalId);
            setDueDate(draft.dueDate ? new Date(draft.dueDate) : undefined);
            setLocalChecklists(draft.localChecklists || []);
            return;
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }
      }

      const initialState = getInitialState();
      setTitle(initialState.title);
      setEstimatedMinutes(initialState.estimatedMinutes);
      setNotes(initialState.notes);
      setIsUrgent(initialState.isUrgent);
      setIsImportant(initialState.isImportant);
      setCategoryId(initialState.categoryId);
      setGoalId(initialState.goalId);
      setDueDate(initialState.dueDate);
      setLocalChecklists(initialState.localChecklists);
    });
  }, [isOpen, initialData, fetchGoals, getInitialState]);

  const initialState = getInitialState();
  const formatDateForCompare = (d?: Date) => d ? format(d, "yyyy-MM-dd") : "";

  const isDirty = 
    title !== initialState.title ||
    estimatedMinutes !== initialState.estimatedMinutes ||
    notes !== initialState.notes ||
    isUrgent !== initialState.isUrgent ||
    isImportant !== initialState.isImportant ||
    categoryId !== initialState.categoryId ||
    goalId !== initialState.goalId ||
    formatDateForCompare(dueDate) !== formatDateForCompare(initialState.dueDate) ||
    JSON.stringify(localChecklists) !== JSON.stringify(initialState.localChecklists);

  const hasDraft = !initialData?.id && isDirty;

  useEffect(() => {
    if (!isOpen || !!initialData?.id) return;

    if (isDirty) {
      const draft = {
        title, estimatedMinutes, notes, isUrgent, isImportant, categoryId, goalId, 
        dueDate: dueDate ? dueDate.toISOString() : undefined, 
        localChecklists
      };
      localStorage.setItem('my_pace_task_draft_new', JSON.stringify(draft));
    } else {
      localStorage.removeItem('my_pace_task_draft_new');
    }
  }, [isDirty, title, estimatedMinutes, notes, isUrgent, isImportant, categoryId, goalId, dueDate, localChecklists, isOpen, initialData]);

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (goalId && goalId !== "none") {
      const selectedGoal = goals.find(g => g.id === goalId);
      if (selectedGoal) {
        Promise.resolve().then(() => {
          if (selectedGoal.categoryId) setCategoryId(selectedGoal.categoryId);
          if (!title && selectedGoal.goalType === 'Time-boxed') setTitle(selectedGoal.title);
          if (!estimatedMinutes && selectedGoal.goalType === 'Time-boxed') {
            setEstimatedMinutes(String(selectedGoal.durationMinutes || 30));
          }
        });
      }
    }
  }, [goalId, goals, estimatedMinutes, title]);

  const handleSubmitInternal = async () => {
    if (!title.trim()) {
      setError(t.taskForm.titleRequired);
      return;
    }
    if (requireDuration && !estimatedMinutes) {
      setError(t.taskForm.durationRequired);
      return;
    }

    const taskData: Partial<Task> = {
      title,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      notes,
      isUrgent,
      isImportant,
      categoryId: categoryId === "none" ? undefined : categoryId,
      goalId: goalId === "none" ? undefined : goalId,
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
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
          await updateTask(initialData.id, taskData);
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

  const associatedGoal = goals.find(g => g.id === (prefilledGoalId || initialData?.goalId));

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
              <Label htmlFor="title">{t.taskForm.titleLabel}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {}}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitInternal();
                }}
                className="bg-card border-border focus:border-primary text-lg font-medium"
                disabled={requireDuration && !!initialData?.title}
              />
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-card border-border focus:border-primary min-h-[100px]"
                  placeholder={t.taskForm.notesPlaceholder}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!requireDuration && !prefilledGoalId && (
              <TaskFormCategory 
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
                categories={categories}
                goalId={goalId}
                associatedGoal={associatedGoal}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-card border-border",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>{t.taskForm.pickDate}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(d) => setDueDate(d)}
                      className="text-foreground"
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <TaskFormDuration 
              value={estimatedMinutes}
              onChange={setEstimatedMinutes}
              requireDuration={requireDuration}
            />
            
            {!requireDuration && !prefilledGoalId && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="urgent" 
                    checked={isUrgent}
                    onCheckedChange={(checked) => setIsUrgent(checked === true)}
                    className="border-border"
                  />
                  <Label htmlFor="urgent" className="cursor-pointer font-normal text-sm">{t.taskForm.urgentLabel}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="important" 
                    checked={isImportant}
                    onCheckedChange={(checked) => setIsImportant(checked === true)}
                    className="border-border"
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
            <Button onClick={handleSubmitInternal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
