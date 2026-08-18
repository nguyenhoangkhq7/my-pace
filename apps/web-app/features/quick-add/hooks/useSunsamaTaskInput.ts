"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTasks } from "@/features/board/hooks/useTasks";
import { useGoals } from "@/features/board/hooks/useGoals";
import { useTranslation } from "@/hooks/use-translation";
import { getApiErrorMessage } from "@/lib/fetchClient";
import type { Task } from "@/features/board/types";

export interface UseSunsamaTaskInputOptions {
  taskId?: string;
  initialTitle?: string;
  initialNotes?: string;
  initialUrgent?: boolean;
  initialImportant?: boolean;
  initialGoalId?: string | null;
  initialCategoryId?: string | null;
  initialDueDate?: Date | null;
  initialDueTime?: string;
  initialEstimatedMinutes?: number | null;
  initialIsSplittable?: boolean;
  initialMinChunkMinutes?: number | null;
  initialMaxDailyDuration?: number | null;
  initialChecklists?: string[];
  requireDuration?: boolean;
  onSubmit?: (task: Partial<Task>) => void | Promise<void>;
  onSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function useSunsamaTaskInput(options?: UseSunsamaTaskInputOptions) {
  const { t } = useTranslation();
  const { goals } = useGoals();
  const [title, setTitle] = useState(options?.initialTitle || "");
  const [notes, setNotes] = useState(options?.initialNotes || "");
  const [showNotes, setShowNotes] = useState(!!options?.initialNotes);
  const [dueDate, setDueDate] = useState<Date | null>(options?.initialDueDate !== undefined ? options.initialDueDate : null);
  const [dueTime, setDueTime] = useState<string>(options?.initialDueTime || "23:59");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(options?.initialEstimatedMinutes || null);
  const [goalId, setGoalIdState] = useState<string | null>(options?.initialGoalId || null);

  // Initialize category: inherit from goal if goal exists, otherwise use initialCategoryId
  const [categoryId, setCategoryId] = useState<string | null>(() => {
    const initGoalId = options?.initialGoalId;
    if (initGoalId) {
      const g = goals.find((item) => item.id === initGoalId);
      if (g?.categoryId) return g.categoryId;
    }
    return options?.initialCategoryId || null;
  });

  const [isUrgent, setIsUrgent] = useState(options?.initialUrgent || false);
  const [isImportant, setIsImportant] = useState(options?.initialImportant || false);
  const [isSplittable, setIsSplittable] = useState(options?.initialIsSplittable || false);
  const [minChunkMinutes, setMinChunkMinutes] = useState<number | null>(options?.initialMinChunkMinutes || 30);
  const [maxDailyDuration, setMaxDailyDuration] = useState<number | null>(options?.initialMaxDailyDuration || null);
  const [checklists, setChecklists] = useState<string[]>(options?.initialChecklists || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { createTask, updateTask, deleteTask } = useTasks();

  const setGoalId = useCallback((newGoalId: string | null) => {
    setGoalIdState(newGoalId);
    if (newGoalId) {
      const g = goals.find((item) => item.id === newGoalId);
      if (g) {
        setCategoryId(g.categoryId || null);
      }
    } else {
      setCategoryId(null);
    }
  }, [goals]);

  const reset = useCallback(() => {
    setTitle(options?.initialTitle || "");
    setNotes(options?.initialNotes || "");
    setShowNotes(false);
    setDueDate(options?.initialDueDate !== undefined ? options.initialDueDate : null);
    setDueTime(options?.initialDueTime || "23:59");
    setEstimatedMinutes(options?.initialEstimatedMinutes || null);
    const initGId = options?.initialGoalId || null;
    setGoalIdState(initGId);
    if (initGId) {
      const g = goals.find((item) => item.id === initGId);
      setCategoryId(g?.categoryId || null);
    } else {
      setCategoryId(options?.initialCategoryId || null);
    }
    setIsUrgent(options?.initialUrgent || false);
    setIsImportant(options?.initialImportant || false);
    setIsSplittable(options?.initialIsSplittable || false);
    setMinChunkMinutes(options?.initialMinChunkMinutes || 30);
    setMaxDailyDuration(options?.initialMaxDailyDuration || null);
    setChecklists(options?.initialChecklists || []);
    setIsLoading(false);
  }, [options, goals]);

  const addChecklistItem = useCallback((item: string) => {
    if (!item.trim()) return;
    setChecklists((prev) => [...prev, item.trim()]);
  }, []);

  const removeChecklistItem = useCallback((index: number) => {
    setChecklists((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setPriority = useCallback((urgent: boolean, important: boolean) => {
    setIsUrgent(urgent);
    setIsImportant(important);
  }, []);

  const handleSubmit = useCallback(async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || isLoading) return false;

    if (cleanTitle.length > 255) {
      toast.warning("Tên công việc không được vượt quá 255 ký tự");
      return false;
    }

    if (options?.requireDuration && !estimatedMinutes) {
      toast.warning(t.sunsamaForm.requireDurationPrompt);
      return false;
    }

    if (isSplittable) {
      const est = estimatedMinutes ? Number(estimatedMinutes) : 0;
      if (!est || est < 15) {
        toast.warning("Thời gian ước tính phải từ 15 phút trở lên mới có thể chia nhỏ");
        return false;
      }
      const minChunk = minChunkMinutes ? Number(minChunkMinutes) : 30;
      if (minChunk < 15) {
        toast.warning("Thời lượng 1 block tối thiểu phải từ 15 phút");
        return false;
      }
      if (est > 0 && minChunk > est) {
        toast.warning(`Thời lượng 1 block (${minChunk}m) không được lớn hơn tổng thời gian công việc (${est}m)`);
        return false;
      }
      if (maxDailyDuration) {
        const maxDaily = Number(maxDailyDuration);
        if (maxDaily > 720) {
          toast.warning("Thời lượng tối đa 1 ngày không được vượt quá 12 tiếng (720 phút)");
          return false;
        }
        if (maxDaily < minChunk) {
          toast.warning(`Thời lượng tối đa 1 ngày (${maxDaily}m) không được nhỏ hơn thời lượng 1 block (${minChunk}m)`);
          return false;
        }
      }
    }

    setIsLoading(true);
    try {
      const formattedDueDate = dueDate && !isNaN(dueDate.getTime())
        ? `${format(dueDate, "yyyy-MM-dd")}T${dueTime || "23:59"}:00`
        : undefined;

      const checklistPayload = checklists
        .filter((c) => c.trim().length > 0)
        .map((c, i) => ({
          title: c.trim(),
          isCompleted: false,
          orderIndex: i,
        }));

      const payload = {
        title: cleanTitle,
        notes: notes.trim(),
        dueDate: formattedDueDate,
        estimatedMinutes: estimatedMinutes !== null ? estimatedMinutes : undefined,
        categoryId: categoryId || undefined,
        goalId: goalId || undefined,
        isUrgent,
        isImportant,
        isSplittable,
        minChunkMinutes: isSplittable ? (minChunkMinutes || 30) : undefined,
        maxDailyDuration: isSplittable ? (maxDailyDuration || undefined) : undefined,
        checklists: checklistPayload,
        clearDueDate: !dueDate,
        clearGoalId: !goalId,
        clearCategoryId: !categoryId,
      };

      if (options?.onSubmit) {
        await options.onSubmit(payload as unknown as Partial<Task>);
        toast.success(options?.taskId ? t.sunsamaForm.updatedSuccess : t.sunsamaForm.createdSuccess);
      } else if (options?.taskId) {
        await updateTask({ id: options.taskId, data: payload as unknown as Partial<Task> });
        toast.success(t.sunsamaForm.updatedSuccess);
      } else {
        await createTask(payload as unknown as Parameters<typeof createTask>[0]);
        toast.success(t.sunsamaForm.createdSuccess);
      }

      reset();
      options?.onSuccess?.();
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, t.sunsamaForm.createFailed);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    notes,
    dueDate,
    dueTime,
    estimatedMinutes,
    categoryId,
    goalId,
    isUrgent,
    isImportant,
    isSplittable,
    minChunkMinutes,
    maxDailyDuration,
    checklists,
    isLoading,
    createTask,
    updateTask,
    reset,
    options,
    t,
  ]);

  const handleDelete = useCallback(async () => {
    if (!options?.taskId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTask(options.taskId);
      toast.success(t.sunsamaForm.deletedSuccess);
      options?.onDeleteSuccess?.();
      options?.onSuccess?.();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể xóa công việc");
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }, [options, isDeleting, deleteTask, t]);

  return {
    isEditMode: !!options?.taskId,
    title,
    setTitle,
    notes,
    setNotes,
    showNotes,
    setShowNotes,
    dueDate,
    setDueDate,
    dueTime,
    setDueTime,
    estimatedMinutes,
    setEstimatedMinutes,
    categoryId,
    setCategoryId,
    goalId,
    setGoalId,
    isUrgent,
    isImportant,
    setPriority,
    isSplittable,
    setIsSplittable,
    minChunkMinutes,
    setMinChunkMinutes,
    maxDailyDuration,
    setMaxDailyDuration,
    checklists,
    addChecklistItem,
    removeChecklistItem,
    isLoading,
    isDeleting,
    handleSubmit,
    handleDelete,
    reset,
  };
}
