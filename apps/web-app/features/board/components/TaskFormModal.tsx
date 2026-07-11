import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task } from "../types";
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
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

// Import new sub-components
import { TaskFormChecklist } from "./TaskFormChecklist";
import { TaskFormDuration } from "./TaskFormDuration";
import { TaskFormCategory } from "./TaskFormCategory";

interface TaskFormModalProps {
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

export function TaskFormModal({ 
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
}: TaskFormModalProps) {
  const { tasks, categories, createTask, updateTask, deleteTask } = useBoardStore();
  const { goals, fetchGoals } = useGoalStore();
  const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore();
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

  const [localChecklists, setLocalChecklists] = useState<{ title: string; isCompleted: boolean }[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const currentTask = initialData?.id ? tasks.find(t => t.id === initialData.id) : null;
  const checklists = currentTask?.checklists || [];

  const draftKey = initialData?.id ? `my_pace_task_draft_${initialData.id}` : 'my_pace_task_draft_new';
  const [hasDraft, setHasDraft] = useState(false);

  const prevIsOpenRef = useRef(false);

  const getInitialState = () => {
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
      estimatedMinutes: initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : "",
      notes: initialData?.notes || "",
      isUrgent: prefilledUrgent !== undefined ? prefilledUrgent : (initialData?.isUrgent || false),
      isImportant: prefilledImportant !== undefined ? prefilledImportant : (initialData?.isImportant || false),
      categoryId: initialData?.categoryId || undefined,
      goalId: prefilledGoalId || initialData?.goalId || undefined,
      dueDate: initialDueDate,
      localChecklists: initialData?.checklists
        ? initialData.checklists.map(c => ({ title: c.title, isCompleted: c.isCompleted, orderIndex: c.orderIndex }))
        : []
    };
  };

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
    setLocalChecklists(initialState.localChecklists as any[]);
    setError("");
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  };

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (justOpened) {

      Promise.resolve().then(() => {
        fetchGoals();
        
        const savedDraft = localStorage.getItem(draftKey);
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
            setError("");
            setIsConfirmDeleteOpen(false);
            return;
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }
        
        resetToInitial();
        setIsConfirmDeleteOpen(false);
      });
    }
  }, [isOpen, initialData, prefilledGoalId, prefilledUrgent, prefilledImportant, planningTarget, initialStatus, fetchGoals, draftKey]);

  useEffect(() => {
    if (!isOpen) return;

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

    setHasDraft(isDirty);

    if (isDirty) {
      const draft = {
        title, estimatedMinutes, notes, isUrgent, isImportant, categoryId, goalId, 
        dueDate: dueDate ? dueDate.toISOString() : undefined, 
        localChecklists
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [title, estimatedMinutes, notes, isUrgent, isImportant, categoryId, goalId, dueDate, localChecklists, isOpen, draftKey]);

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
          if (!title && (selectedGoal.goalType === 'Time-boxed' || selectedGoal.goalType === 'Milestone')) setTitle(selectedGoal.title);
          if (!estimatedMinutes && selectedGoal.goalType === 'Time-boxed' && selectedGoal.timeBoxedGoal) {
            const target = selectedGoal.timeBoxedGoal.targetMinutes;
            const period = Math.max(selectedGoal.timeBoxedGoal.periodDays, 1);
            setEstimatedMinutes(String(Math.round(target / period)));
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
      taskData.checklists = localChecklists as any[];
    }

    if (initialStatus && !initialData?.id) {
      taskData.status = initialStatus;
    }

    if (onSubmit) {
      onSubmit(taskData);
    } else {
      try {
        if (initialData?.id) {
          await updateTask(initialData.id, taskData);
        } else {
          await createTask(taskData);
        }
        localStorage.removeItem(draftKey);
        if (isTourActive && tourStepIndex === 3) {
          advanceTourStep();
        }
        handleClose();
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialData?.id) return;
    try {
      await deleteTask(initialData.id);
      localStorage.removeItem(draftKey);
      setIsConfirmDeleteOpen(false);
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setIsConfirmDeleteOpen(false);
    }
  };

  const associatedGoal = goals.find(g => g.id === (prefilledGoalId || initialData?.goalId));

  return (
    <Dialog modal={!isTourActive} open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (isTourActive) return;
        handleClose();
      }
    }}>
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
          {/* Main Content (Left Column) */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t.taskForm.titleLabel}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={async () => {
                  if (initialData?.id && title.trim() && title !== initialData.title) {
                    try {
                      await updateTask(initialData.id, { title: title.trim() });
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    if (initialData?.id && title.trim() && title !== initialData.title) {
                      try {
                        await updateTask(initialData.id, { title: title.trim() });
                        (e.target as HTMLInputElement).blur();
                      } catch (err) {
                        console.error(err);
                      }
                    } else if (!initialData?.id) {
                      handleSubmitInternal();
                    }
                  }
                }}
                className="bg-card border-border focus:border-primary text-lg font-medium tour-task-title-input"
                disabled={requireDuration && !!initialData?.title}
              />
            </div>
            
            {/* Checklist Section */}
            {!requireDuration && (
              initialData?.id ? (
                <TaskFormChecklist taskId={initialData.id} checklists={checklists} />
              ) : (
                <TaskFormChecklist 
                  checklists={localChecklists} 
                  onAddChecklistLocal={(title) => setLocalChecklists(prev => [...prev, { title, isCompleted: false, orderIndex: prev.length } as any])}
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

          {/* Sidebar (Right Column) */}
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
              <div className="grid grid-cols-2 gap-4 mt-2 tour-urgent-important">
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
            {!requireDuration && hasDraft && (
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
            <Button onClick={handleSubmitInternal} className="bg-primary hover:bg-primary/90 text-primary-foreground tour-save-task-btn">
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
    </Dialog>
  );
}
