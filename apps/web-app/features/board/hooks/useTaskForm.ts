import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useBoardStore } from "../store/board.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { getApiErrorMessage } from "@/lib/fetchClient";
import { Task } from "../types";

export const CATEGORY_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#6366f1", "#14b8a6", "#ec4899", "#ef4444", "#475569"];

export interface UseTaskFormProps {
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

export function useTaskForm({
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
  initialStatus,
}: UseTaskFormProps) {
  const {
    tasks,
    categories,
    createCategory,
    createTask,
    updateTask,
    deleteTask,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem
  } = useBoardStore();
  const { goals, fetchGoals } = useGoalStore();

  const durationInputRef = useRef<HTMLInputElement>(null);
  const categoryColorInputRef = useRef<HTMLInputElement>(null);

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
        setIsCreatingCategory(false);
        setNewChecklistTitle("");
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

  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true);
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

  const handleUpdateChecklistItem = async (checklistId: string, isCompleted: boolean) => {
    if (!initialData?.id) return;
    try {
      await updateChecklistItem(initialData.id, checklistId, { isCompleted });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChecklistItem = async (checklistId: string) => {
    if (!initialData?.id) return;
    try {
      await deleteChecklistItem(initialData.id, checklistId);
    } catch (err) {
      console.error(err);
    }
  };

  const associatedGoal = goals.find(g => g.id === (prefilledGoalId || initialData?.goalId));
  const completedChecklistsCount = checklists.filter(c => c.isCompleted).length;
  const progressPercentage = checklists.length > 0 ? Math.round((completedChecklistsCount / checklists.length) * 100) : 0;

  return {
    title,
    setTitle,
    estimatedMinutes,
    setEstimatedMinutes,
    notes,
    setNotes,
    isUrgent,
    setIsUrgent,
    isImportant,
    setIsImportant,
    categoryId,
    setCategoryId,
    goalId,
    setGoalId,
    dueDate,
    setDueDate,
    error,
    setError,

    // Category Creation
    isCreatingCategory,
    setIsCreatingCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    handleCreateCategory,
    categoryColorInputRef,

    // Category Management Modal
    isManagingCategories,
    setIsManagingCategories,

    // Checklist
    newChecklistTitle,
    setNewChecklistTitle,
    handleAddChecklist,
    handleUpdateChecklistItem,
    handleDeleteChecklistItem,
    checklists,
    progressPercentage,

    // Delete Confirmation
    isConfirmDeleteOpen,
    setIsConfirmDeleteOpen,
    handleDeleteClick,
    handleConfirmDelete,

    // Form Handlers
    handleClose,
    handleSubmitInternal,
    durationInputRef,

    // Store data
    categories,
    goals,
    associatedGoal,
  };
}
