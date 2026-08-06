import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useBoardStore } from "../store/board.store";
import { useShallow } from "zustand/react/shallow";
import { useAvailableTimeQuery } from "../../available-time/hooks/useAvailableTime";
import { Task } from "../types";
import { useTasks } from "./useTasks";
import { useDailyPlan } from "./useDailyPlan";
import { useCategories } from "./useCategories";

export function useBacklogMatrix(currentDate: string, tomorrowDate: string) {
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
    if (planningTarget === 'today') return dailyPlanToday;
    if (planningTarget === 'tomorrow') return dailyPlanTomorrow;
    return null;
  }, [planningTarget, dailyPlanToday, dailyPlanTomorrow]);


  const { data: dataToday } = useAvailableTimeQuery(currentDate);
  const { data: dataTomorrow } = useAvailableTimeQuery(tomorrowDate);
  
  const availableTimeData = useMemo(() => {
    if (planningTarget === 'today') return dataToday;
    if (planningTarget === 'tomorrow') return dataTomorrow;
    return null;
  }, [planningTarget, dataToday, dataTomorrow]);

  const availableMinutes = availableTimeData?.availableMinutes || 0;

  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);

  const checkTimeLimit = (newEstimatedMinutes: number) => {
    const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
    const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);

    if (usedTime + newEstimatedMinutes > availableMinutes) {
      toast.warning("Task này vượt quá thời gian trống còn lại trong ngày!");
    }
  };

  const handleCreateTask = async (data: Partial<Task>) => {
    let newTask;
    if (editingTask) {
      await updateTask({id: editingTask.id, data});
    } else {
      newTask = await createTask(data);
      if (isPlanningMode && newTask) {
        if (newTask.estimatedMinutes) {
          checkTimeLimit(newTask.estimatedMinutes);
          addPlannedTaskLocally(newTask);
        }
      }
    }
    closeTaskModal();
  };

  const handleTaskClick = (task: Task) => {
    if (isPlanningMode) {
      const isTargetStarted = !!targetPlan?.isConfirmed;
      if (isTargetStarted) {
        toast.error("Kế hoạch đã chốt và đang thực thi, không thể chỉnh sửa.");
        return;
      }
      if (plannedTaskIds.includes(task.id)) {
        removePlannedTaskLocally(task.id);
      } else {
        if (!task.estimatedMinutes) {
          setRequireDurationForTask(task);
        } else {
          checkTimeLimit(task.estimatedMinutes);
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
      if (updatedTask && updatedTask.estimatedMinutes) {
        checkTimeLimit(updatedTask.estimatedMinutes);
      }
      addPlannedTaskLocally(updatedTask);
      setRequireDurationForTask(undefined);
    }
  };

  return {
    tasks,
    isPlanningMode,
    plannedTaskIds,
    isTaskModalOpen,
    editingTask,
    prefilledGoalId,
    requireDuration,
    requireDurationForTask,
    setRequireDurationForTask,
    selectedFilterId,
    setFilter,
    categories,

    // Handlers
    handleCreateTask,
    handleTaskClick,
    handleTaskDrop,
    handleMissingDurationSubmit,
  };
}
