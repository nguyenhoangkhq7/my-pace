import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useBoardStore } from "../store/board.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Delete01Icon, PlusSignIcon, Tick01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ManageCategoriesModal } from "./ManageCategoriesModal";

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

const CATEGORY_COLORS = ["#64748b", "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

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
  const { tasks, categories, createCategory, createTask, updateTask, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useBoardStore();
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

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  const currentTask = initialData?.id ? tasks.find(t => t.id === initialData.id) : null;
  const checklists = currentTask?.checklists || [];

  useEffect(() => {
    if (isOpen) {
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
        // Default to today when creating from Habit/Target goal
        setDueDate(new Date());
      } else {
        setDueDate(undefined);
      }
      
      setError("");
      setIsCreatingCategory(false);
      setNewChecklistTitle("");
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
        if (selectedGoal.categoryId) {
          setCategoryId(selectedGoal.categoryId);
        }
        if (!title && (selectedGoal.goalType === 'Time-boxed' || selectedGoal.goalType === 'Milestone')) {
          setTitle(selectedGoal.title);
        }
        if (!estimatedMinutes && selectedGoal.goalType === 'Time-boxed' && selectedGoal.timeBoxedGoal) {
          const target = selectedGoal.timeBoxedGoal.targetMinutes;
          const period = Math.max(selectedGoal.timeBoxedGoal.periodDays, 1);
          setEstimatedMinutes(String(Math.round(target / period)));
        }
      }
    }
  }, [goalId, goals]);

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
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName, color: newCategoryColor });
      setCategoryId(cat.id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !initialData?.id) return;
    try {
      await addChecklistItem(initialData.id, newChecklistTitle.trim());
      setNewChecklistTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const inProgressGoals = goals.filter(g => g.status === "In Progress");
  const associatedGoal = goals.find(g => g.id === (prefilledGoalId || initialData?.goalId));
  const completedChecklistsCount = checklists.filter(c => c.isCompleted).length;
  const progressPercentage = checklists.length > 0 ? Math.round((completedChecklistsCount / checklists.length) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
        "bg-slate-950 text-slate-50 border-slate-800 max-h-[90vh] overflow-y-auto scrollbar-thin",
        requireDuration ? "sm:max-w-[425px]" : "sm:max-w-[800px]"
      )}>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? (requireDuration ? "Missing Information" : "Edit Task") : "Create Task"}</DialogTitle>
          {requireDuration && (
            <DialogDescription className="text-slate-400">
              Please provide the estimated duration to add this task to your plan.
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className={cn("grid py-4", requireDuration ? "gap-4" : "grid-cols-1 md:grid-cols-3 gap-6")}>
          {/* Main Content (Left Column) */}
          <div className={cn("space-y-4", !requireDuration && "md:col-span-2")}>
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
              <div className="grid gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Tick01Icon} className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold">Việc cần làm</h3>
                </div>
                
                {checklists.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-400 w-8">{progressPercentage}%</span>
                    <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {checklists.map(item => (
                    <div key={item.id} className="flex items-start gap-3 group">
                      <Checkbox 
                        checked={item.isCompleted} 
                        onCheckedChange={(checked) => updateChecklistItem(initialData.id!, item.id, { isCompleted: checked === true })}
                        className="mt-1 border-slate-700"
                      />
                      <span className={cn("flex-1 text-sm pt-0.5", item.isCompleted && "line-through text-slate-500")}>
                        {item.title}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"
                        onClick={() => deleteChecklistItem(initialData.id!, item.id)}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddChecklist} className="flex gap-2 mt-2">
                  <Input 
                    value={newChecklistTitle}
                    onChange={e => setNewChecklistTitle(e.target.value)}
                    placeholder="Thêm một mục"
                    className="bg-slate-900 border-slate-800 h-9"
                  />
                  <Button type="submit" size="sm" variant="secondary" className="h-9">
                    Thêm
                  </Button>
                </form>
              </div>
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
              <div className="grid gap-2">
                <Label>Category</Label>
                {isCreatingCategory ? (
                  <div className="space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-md">
                    <Input 
                      placeholder="Category Name" 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                      className="bg-slate-950 border-slate-800"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_COLORS.map(c => (
                        <div 
                          key={c} 
                          onClick={() => setNewCategoryColor(c)}
                          className={cn("w-5 h-5 rounded-full cursor-pointer ring-offset-slate-900", newCategoryColor === c ? "ring-2 ring-white" : "")}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 flex-1 px-2" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs bg-primary text-white flex-1 px-2" onClick={handleCreateCategory}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-1.5">
                    <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? undefined : val)} disabled={!!goalId && goalId !== "none"}>
                      <SelectTrigger className="w-full bg-slate-900 border-slate-800">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                              <span>{c.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-2 shrink-0" onClick={() => setIsCreatingCategory(true)} disabled={!!goalId && goalId !== "none"} title="Thêm Category">
                      <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-2 shrink-0" onClick={() => setIsManagingCategories(true)} title="Quản lý Category">
                      <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!requireDuration && associatedGoal && (
              <div className="grid gap-2">
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
                      onSelect={setDueDate as any}
                      className="text-slate-200"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (mins) {requireDuration && "*"}</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="bg-slate-900 border-slate-800 focus:border-primary"
              />
            </div>
            
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
        
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleClose} className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSubmitInternal} className="bg-primary hover:bg-primary/90 text-white">
            {requireDuration ? "Continue" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ManageCategoriesModal isOpen={isManagingCategories} onClose={() => setIsManagingCategories(false)} />
    </Dialog>
  );
}
