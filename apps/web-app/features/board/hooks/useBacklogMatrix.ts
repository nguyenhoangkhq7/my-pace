import { useState } from "react";
import { toast } from "sonner";
import { useBoardStore } from "../store/board.store";
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
  } = useBoardStore();

  const { tasks, createTask, updateTask } = useTasks();
  const { categories } = useCategories();
  const { dailyPlan: dailyPlanToday } = useDailyPlan(currentDate);
  const { dailyPlan: dailyPlanTomorrow } = useDailyPlan(tomorrowDate);

  const isStarted = dailyPlanToday?.isConfirmed ?? false;

  const { data: dataToday } = useAvailableTimeQuery(currentDate);
  const { data: dataTomorrow } = useAvailableTimeQuery(tomorrowDate);
  
  const availableTimeData = planningTarget === 'today' ? dataToday : dataTomorrow;
  const availableMinutes = availableTimeData?.availableMinutes || 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);
  const [prefilledGoalForTask, setPrefilledGoalForTask] = useState<string | undefined>(undefined);

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
      newTask = await updateTask({ id: editingTask.id, data });
    } else {
      newTask = await createTask(data);
      if (isPlanningMode && newTask) {
        if (newTask.estimatedMinutes) {
          checkTimeLimit(newTask.estimatedMinutes);
          addPlannedTaskLocally(newTask);
        }
      }
    }
    setIsModalOpen(false);
    setEditingTask(undefined);
    setPrefilledGoalForTask(undefined);
  };

  const handleTaskClick = (task: Task) => {
    if (isPlanningMode) {
      const isTargetStarted = planningTarget === 'today' ? isStarted : (dailyPlanTomorrow?.isConfirmed ?? false);
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
      setEditingTask(task);
      setIsModalOpen(true);
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
    isModalOpen,
    setIsModalOpen,
    editingTask,
    setEditingTask,
    requireDurationForTask,
    setRequireDurationForTask,
    prefilledGoalForTask,
    setPrefilledGoalForTask,
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
