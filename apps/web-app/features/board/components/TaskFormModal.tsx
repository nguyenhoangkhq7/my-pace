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
  
  const [title, setTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState("");

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const currentTask = initialData?.id ? tasks.find(t => t.id === initialData.id) : null;
  const checklists = currentTask?.checklists || [];

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (justOpened) {
      Promise.resolve().then(() => {
        fetchGoals();
        setTitle(initialData?.title || "");
        setEstimatedMinutes(initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : "");
        setNotes(initialData?.notes || "");
        
        setIsUrgent(prefilledUrgent !== undefined ? prefilledUrgent : (initialData?.isUrgent || false));
        setIsImportant(prefilledImportant !== undefined ? prefilledImportant : (initialData?.isImportant || false));
        
        setCategoryId(initialData?.categoryId || undefined);
        setGoalId(prefilledGoalId || initialData?.goalId || undefined);
        
        if (initialData?.dueDate) {
          setDueDate(new Date(initialData.dueDate));
        } else if (planningTarget) {
          const targetDate = new Date();
          if (planningTarget === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
          setDueDate(targetDate);
        } else if (prefilledGoalId && initialStatus !== 'Icebox' && !initialData?.id) {
          setDueDate(new Date());
        } else {
          setDueDate(undefined);
        }
        
        setError("");
        setIsConfirmDeleteOpen(false);
      });
    }
  }, [isOpen, initialData, prefilledGoalId, prefilledUrgent, prefilledImportant, planningTarget, initialStatus, fetchGoals]);

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
      setError("Title is required.");
      return;
    }
    if (requireDuration && !estimatedMinutes) {
      setError("Estimated duration is required to plan this task.");
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
      setIsConfirmDeleteOpen(false);
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setIsConfirmDeleteOpen(false);
    }
  };

  const associatedGoal = goals.find(g => g.id === (prefilledGoalId || initialData?.goalId));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
        "bg-slate-950 text-slate-50 border-slate-800 max-h-[90vh] overflow-y-auto scrollbar-thin",
        requireDuration ? "sm:max-w-[425px]" : "sm:max-w-[840px]"
      )}>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? (requireDuration ? "Missing Information" : "Edit Task") : "Create Task"}</DialogTitle>
          {requireDuration && (
            <DialogDescription className="text-slate-400">
              Please provide the estimated duration to add this task to your plan.
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className={cn("grid py-4", requireDuration ? "gap-4" : "grid-cols-1 md:grid-cols-2 gap-6")}>
          {/* Main Content (Left Column) */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-900 border-slate-800 focus:border-primary text-lg font-medium"
                disabled={requireDuration && !!initialData?.title}
              />
            </div>
            
            {/* Checklist Section */}
            {!requireDuration && initialData?.id && (
              <TaskFormChecklist taskId={initialData.id} checklists={checklists} />
            )}
            
            {!requireDuration && (
              <div className="grid gap-2 pt-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-900 border-slate-800 focus:border-primary min-h-[100px]"
                  placeholder="Add a more detailed description..."
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
                <Label>Goal</Label>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-md text-sm text-slate-300 font-medium">
                  {associatedGoal.title}
                </div>
              </div>
            )}

            {!requireDuration && (
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-900 border-slate-800",
                        !dueDate && "text-slate-400"
                      )}
                    >
                      <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-950 border-slate-800">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(d) => setDueDate(d)}
                      className="text-slate-200"
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
                    className="border-slate-700"
                  />
                  <Label htmlFor="urgent" className="cursor-pointer font-normal text-sm">Urgent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="important" 
                    checked={isImportant}
                    onCheckedChange={(checked) => setIsImportant(checked === true)}
                    className="border-slate-700"
                  />
                  <Label htmlFor="important" className="cursor-pointer font-normal text-sm">Important</Label>
                </div>
              </div>
            )}
          </div>
          
          {error && <p className="text-red-500 text-sm md:col-span-3">{error}</p>}
        </div>
        
        <DialogFooter className="mt-2 flex flex-row items-center justify-between sm:justify-between w-full">
          <div>
            {!requireDuration && initialData?.id && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 font-medium gap-1 px-2 h-9 cursor-pointer"
              >
                <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                Delete Task
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSubmitInternal} className="bg-primary hover:bg-primary/90 text-white">
              {requireDuration ? "Continue" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      
      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Xóa Task này?"
        description="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa Task này không?"
      />
    </Dialog>
  );
}
