import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useBoardStore } from "../store/board.store";
import { useShallow } from "zustand/react/shallow";
import { useAvailableTimeQuery } from "../../available-time/hooks/useAvailableTime";
import { Task } from "../types";
import { useTasks } from "./useTasks";
import { useDailyPlan } from "./useDailyPlan";
import { useCategories } from "./useCategories";
import { useBatchSlack } from "./useAutoScheduleSlack";
import { useTranslation } from "@/hooks/use-translation";

export function useBacklogMatrix(currentDate: string, tomorrowDate: string) {
  const { t } = useTranslation();
  const {
    isPlanningMode,
    plannedTaskIds,
    addPlannedTaskLocally,
    removePlannedTaskLocally,
    planningTarget,
    selectedFilterId,
    setFilter,
    editingTask,
    isTaskModalOpen,
    prefilledGoalId,
    requireDuration,
    openTaskModal,
    closeTaskModal,
  } = useBoardStore(useShallow((s) => ({
    isPlanningMode: s.isPlanningMode,
    plannedTaskIds: s.plannedTaskIds,
    addPlannedTaskLocally: s.addPlannedTaskLocally,
    removePlannedTaskLocally: s.removePlannedTaskLocally,
    planningTarget: s.planningTarget,
    selectedFilterId: s.selectedFilterId,
    setFilter: s.setFilter,
    editingTask: s.editingTask,
    isTaskModalOpen: s.isTaskModalOpen,
    prefilledGoalId: s.prefilledGoalId,
    requireDuration: s.requireDuration,
    openTaskModal: s.openTaskModal,
    closeTaskModal: s.closeTaskModal,
  })));

  const { tasks, createTask, updateTask } = useTasks();
  const { categories } = useCategories();
  
  const todayPlan = useDailyPlan(currentDate);
  const tomorrowPlan = useDailyPlan(tomorrowDate);

  const dailyPlanToday = todayPlan.dailyPlan;
  const dailyPlanTomorrow = tomorrowPlan.dailyPlan;

  const targetPlan = useMemo(() => {
    const target = planningTarget || 'today';
    if (target === 'today') return dailyPlanToday;
    if (target === 'tomorrow') return dailyPlanTomorrow;
    return null;
  }, [planningTarget, dailyPlanToday, dailyPlanTomorrow]);

  const originalPlanTaskIds = useMemo(() => {
    if (!targetPlan || !targetPlan.tasks) return [];
    return targetPlan.tasks.map(pt => pt.task?.id).filter(Boolean);
  }, [targetPlan]);

  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | null>(null);
  
  // Swap Task State
  const [swapUrgentTask, setSwapUrgentTask] = useState<Task | null>(null);

  const isTargetStarted = !!(targetPlan?.isConfirmed);

  const targetDateStr = (planningTarget || 'today') === 'today' ? currentDate : tomorrowDate;
  const { data: availableData } = useAvailableTimeQuery(targetDateStr);
  const totalAvailable = availableData?.availableMinutes ?? 0;

  const { batchSlack } = useBatchSlack();
  const [slackTimes, setSlackTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    const backlogTaskIds = tasks
      .filter(t => t.status === "Backlog" || t.status === "Icebox")
      .map(t => t.id);
    if (backlogTaskIds.length > 0) {
      batchSlack(backlogTaskIds).then(res => {
        if (res) setSlackTimes(res);
      });
    }
  }, [tasks, batchSlack]);
  const handleCreateTask = async (data: Partial<Task>) => {
    let newTask;
    if (editingTask) {
      await updateTask({id: editingTask.id, data});
    } else {
      newTask = await createTask(data);
      if (isPlanningMode && newTask) {
        if (newTask.estimatedMinutes) {
          addPlannedTaskLocally(newTask);
        }
      }
    }
    closeTaskModal();
  };

  const handleTaskClick = (task: Task) => {
    if (isPlanningMode) {
      if (isTargetStarted) {
        toast.error(t.board.planLockedError);
        return;
      }
      if (plannedTaskIds.includes(task.id)) {
        removePlannedTaskLocally(task.id);
      } else {
        if (!task.estimatedMinutes) {
          setRequireDurationForTask(task);
        } else {
          addPlannedTaskLocally(task);
        }
      }
    } else {
      openTaskModal(task);
    }
  };

  const handleTaskDrop = async (taskId: string, isUrgent: boolean, isImportant: boolean) => {
    await updateTask({ id: taskId, data: { isUrgent, isImportant } });
  };

  const handleMissingDurationSubmit = async (data: Partial<Task>) => {
    if (requireDurationForTask) {
      const updatedTask = await updateTask({ id: requireDurationForTask.id, data });
      if (updatedTask) {
        addPlannedTaskLocally(updatedTask);
      }
      setRequireDurationForTask(null);
    }
  };

  return {
    tasks,
    isPlanningMode,
    plannedTaskIds,
    originalPlanTaskIds,
    isTaskModalOpen,
    editingTask,
    prefilledGoalId,
    requireDuration,
    requireDurationForTask,
    setRequireDurationForTask,
    selectedFilterId,
    setFilter,
    categories,
    slackTimes,
    isTargetStarted,
    swapUrgentTask,
    setSwapUrgentTask,
    targetPlan,
    totalAvailable,

    // Handlers
    handleCreateTask,
    handleTaskClick,
    handleTaskDrop,
    handleMissingDurationSubmit,
  };
}
