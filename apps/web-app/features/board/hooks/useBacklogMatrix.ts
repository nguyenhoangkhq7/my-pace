import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeStore } from "../../available-time/store/available-time.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { Task } from "../types";
import { Goal } from "@/features/goal/types";

export function useBacklogMatrix() {
  const {
    tasks,
    isPlanningMode,
    plannedTaskIds,
    addPlannedTaskLocally,
    removePlannedTaskLocally,
    createTask,
    updateTask,
    isStarted,
    planningTarget,
    dailyPlanTomorrow,
    selectedFilterId,
    setFilter,
    categories,
  } = useBoardStore();

  const { dataToday, dataTomorrow } = useAvailableTimeStore();
  const { goals, fetchGoals } = useGoalStore();

  const availableTimeData = planningTarget === 'today' ? dataToday : dataTomorrow;
  const availableMinutes = availableTimeData?.availableMinutes || 0;

  const [activeTab, setActiveTab] = useState<'tasks' | 'goals'>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);
  const [prefilledGoalForTask, setPrefilledGoalForTask] = useState<string | undefined>(undefined);

  const [isGoalDetailModalOpen, setIsGoalDetailModalOpen] = useState(false);
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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
      newTask = await updateTask(editingTask.id, data);
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

  const handleGoalClick = (goal: Goal) => {
    if (goal.goalType === 'Binary') {
      setSelectedGoalForDetail(goal);
      setIsGoalDetailModalOpen(true);
      return;
    }

    if (isPlanningMode) {
      const isTargetStarted = planningTarget === 'today' ? isStarted : (dailyPlanTomorrow?.isConfirmed ?? false);
      if (isTargetStarted) {
        toast.error("Kế hoạch đã chốt và đang thực thi, không thể chỉnh sửa.");
        return;
      }
      setPrefilledGoalForTask(goal.id);
      setIsModalOpen(true);
    } else {
      toast.info("Chỉ có thể tạo Task từ Goal trong chế độ Lập kế hoạch.");
    }
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

  const handleMissingDurationSubmit = async (data: Partial<Task>) => {
    if (requireDurationForTask) {
      const updatedTask = await updateTask(requireDurationForTask.id, data);
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
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    editingTask,
    setEditingTask,
    requireDurationForTask,
    setRequireDurationForTask,
    prefilledGoalForTask,
    setPrefilledGoalForTask,
    isGoalDetailModalOpen,
    setIsGoalDetailModalOpen,
    selectedGoalForDetail,
    goals,
    selectedFilterId,
    setFilter,
    categories,

    // Handlers
    handleCreateTask,
    handleGoalClick,
    handleTaskClick,
    handleMissingDurationSubmit,
  };
}
