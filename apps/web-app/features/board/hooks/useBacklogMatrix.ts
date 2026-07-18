import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeQuery } from "../../available-time/hooks/useAvailableTime";
import { Task } from "../types";
import { useTasks } from "./useTasks";
import { useDailyPlan } from "./useDailyPlan";
import { useCategories } from "./useCategories";

export function useBacklogMatrix(currentDate: string, tomorrowDate: string, day2Date: string, day3Date: string) {
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
  
  const todayPlan = useDailyPlan(currentDate);
  const tomorrowPlan = useDailyPlan(tomorrowDate);
  const day2Plan = useDailyPlan(day2Date);
  const day3Plan = useDailyPlan(day3Date);

  const dailyPlanToday = todayPlan.dailyPlan;
  const dailyPlanTomorrow = tomorrowPlan.dailyPlan;
  const dailyPlanDay2 = day2Plan.dailyPlan;
  const dailyPlanDay3 = day3Plan.dailyPlan;

  const targetPlan = useMemo(() => {
    if (planningTarget === 'today') return dailyPlanToday;
    if (planningTarget === 'tomorrow') return dailyPlanTomorrow;
    if (planningTarget === 'day2') return dailyPlanDay2;
    if (planningTarget === 'day3') return dailyPlanDay3;
    return null;
  }, [planningTarget, dailyPlanToday, dailyPlanTomorrow, dailyPlanDay2, dailyPlanDay3]);


  const { data: dataToday } = useAvailableTimeQuery(currentDate);
  const { data: dataTomorrow } = useAvailableTimeQuery(tomorrowDate);
  const { data: dataDay2 } = useAvailableTimeQuery(day2Date);
  const { data: dataDay3 } = useAvailableTimeQuery(day3Date);
  
  const availableTimeData = useMemo(() => {
    if (planningTarget === 'today') return dataToday;
    if (planningTarget === 'tomorrow') return dataTomorrow;
    if (planningTarget === 'day2') return dataDay2;
    if (planningTarget === 'day3') return dataDay3;
    return null;
  }, [planningTarget, dataToday, dataTomorrow, dataDay2, dataDay3]);

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
