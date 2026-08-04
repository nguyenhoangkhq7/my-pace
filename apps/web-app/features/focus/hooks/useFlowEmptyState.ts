import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import { useTasks } from "@/features/board/hooks/useTasks";
import { usePlanMyDay } from "@/features/board/hooks/usePlanMyDay";
import { useReviewPlan } from "@/features/board/hooks/useReviewPlan";
import { useAvailableTimeQuery } from "@/features/available-time/hooks/useAvailableTime";
import { useDailyPlan } from "@/features/board/hooks/useDailyPlan";
import { useBoardStore } from "@/features/board/store/board.store";
import { useState } from "react";
import type { Task } from "@/features/board/types";

export function useFlowEmptyState() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);

  const { tasks, updateTask } = useTasks();
  const { dailyPlan: dailyPlanToday } = useDailyPlan(todayStr);
  const { planMyDay } = usePlanMyDay(todayStr);
  const { reviewPlan } = useReviewPlan();
  const { data: dataToday } = useAvailableTimeQuery(todayStr);

  const [isAddingTask, setIsAddingTask] = useState(false);

  const addAndSaveTask = async (task: Task) => {
    if (!dailyPlanToday || isAddingTask) return;
    setIsAddingTask(true);

    const currentPlannedIds = dailyPlanToday.tasks.map((pt) => pt.task.id);
    const updatedIds = [...currentPlannedIds, task.id];
    useBoardStore.setState({ plannedTaskIds: updatedIds });

    const tasksPayload = updatedIds.map((taskId, index) => {
      const existingTask = dailyPlanToday.tasks.find((pt) => pt.task.id === taskId);
      return {
        taskId,
        isMit: existingTask ? existingTask.isMit : false,
        sortOrder: index,
      };
    });

    try {
      await planMyDay({
        availableMinutes: dailyPlanToday.availableMinutes,
        tasks: tasksPayload,
      });
      await queryClient.invalidateQueries({ queryKey: ["dailyPlan", todayStr] });
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleDurationSubmit = async (
    requireDurationForTask: Task,
    taskData: Partial<Task>,
    onDone: () => void
  ) => {
    const estimatedMinutes = taskData.estimatedMinutes ?? 0;
    await updateTask({ id: requireDurationForTask.id, data: { estimatedMinutes } });
    const updatedTask = { ...requireDurationForTask, estimatedMinutes };
    onDone();
    await addAndSaveTask(updatedTask);
  };

  const handleReviewConfirm = async () => {
    if (!dailyPlanToday) return;
    await reviewPlan({
      planDate: dailyPlanToday.planDate,
      today: todayStr,
      taskReviews: [],
    });
  };

  return {
    tasks,
    dailyPlanToday,
    dataToday,
    todayStr,
    isAddingTask,
    addAndSaveTask,
    handleDurationSubmit,
    handleReviewConfirm,
  };
}
