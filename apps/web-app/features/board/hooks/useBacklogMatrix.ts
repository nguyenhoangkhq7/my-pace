import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeStore } from "../../available-time/store/available-time.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { Task } from "../types";
import { Goal } from "@/features/goal/types";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

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
    const { isTourActive, tourStepIndex, setTourStep } = useOnboardingStore.getState();
    if (isTourActive && (tourStepIndex >= 2 && tourStepIndex <= 4)) {
      // Always go to step 5 (Plan My Day) after task creation — never skip it
      setTourStep(5);
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
          if (useOnboardingStore.getState().isTourActive) {
            updateTask(task.id, { estimatedMinutes: 30 }).then(updated => {
              if (updated) {
                checkTimeLimit(30);
                addPlannedTaskLocally(updated);
                // Advance tour to step 7 (save plan) after task added
                const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore.getState();
                if (isTourActive && tourStepIndex === 6) {
                  setTimeout(() => advanceTourStep(), 400);
                }
              }
            });
          } else {
            setRequireDurationForTask(task);
            setIsModalOpen(true);
          }
        } else {
          checkTimeLimit(task.estimatedMinutes);
          addPlannedTaskLocally(task);
          // Advance tour to step 7 (save plan) after task added
          const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore.getState();
          if (isTourActive && tourStepIndex === 6) {
            setTimeout(() => advanceTourStep(), 400);
          }
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
