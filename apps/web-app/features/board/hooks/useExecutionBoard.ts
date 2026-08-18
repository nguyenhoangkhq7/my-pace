import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useBoardStore } from "../store/board.store";
import { useShallow } from "zustand/react/shallow";
import { useAvailableTimeQuery } from "@/features/available-time/hooks/useAvailableTime";
import { useAuthStore } from "@/features/auth";
import { fetchClient } from "@/lib/fetchClient";

import { useTasks } from "./useTasks";
import { useDailyPlan } from "./useDailyPlan";
import { useTaskTimeBlocks } from "./useTaskTimeBlocks";
import { useBatchSlack } from "./useAutoScheduleSlack";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface UseExecutionBoardProps {
  currentDate: string;
  tomorrowDate: string;
}

export function useExecutionBoard({ currentDate, tomorrowDate }: UseExecutionBoardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const {
    isPlanningMode,
    planningTarget,
    setPlanningMode,
    plannedTaskIds,
    removePlannedTaskLocally,
  } = useBoardStore(useShallow((s) => ({
    isPlanningMode: s.isPlanningMode,
    planningTarget: s.planningTarget,
    setPlanningMode: s.setPlanningMode,
    plannedTaskIds: s.plannedTaskIds,
    removePlannedTaskLocally: s.removePlannedTaskLocally,
  })));

  const { tasks } = useTasks();
  const todayPlan = useDailyPlan(currentDate);
  const tomorrowPlan = useDailyPlan(tomorrowDate);

  const dailyPlanToday = todayPlan.dailyPlan;
  const dailyPlanTomorrow = tomorrowPlan.dailyPlan;
  
  const isStarted = dailyPlanToday?.isConfirmed ?? false;

  const { data: dataToday } = useAvailableTimeQuery(currentDate);
  const { data: dataTomorrow } = useAvailableTimeQuery(tomorrowDate);

  const { data: timeBlocksToday } = useTaskTimeBlocks(currentDate, currentDate);
  const { data: timeBlocksTomorrow } = useTaskTimeBlocks(tomorrowDate, tomorrowDate);

  const [activeTab, setActiveTab] = useState("today");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStartMyDayOpen, setIsStartMyDayOpen] = useState(false);
  const [isOverloadModalOpen, setIsOverloadModalOpen] = useState(false);

  const activePlanHook = useMemo(() => {
    if (activeTab === "today") return todayPlan;
    return tomorrowPlan;
  }, [activeTab, todayPlan, tomorrowPlan]);

  const currentPlan = useMemo(() => {
    if (activeTab === "today") return dailyPlanToday;
    return dailyPlanTomorrow;
  }, [activeTab, dailyPlanToday, dailyPlanTomorrow]);

  const currentTimeBlocks = useMemo(() => {
    if (activeTab === "today") return timeBlocksToday;
    return timeBlocksTomorrow;
  }, [activeTab, timeBlocksToday, timeBlocksTomorrow]);

  const targetDate = useMemo(() => {
    if (activeTab === "today") return currentDate;
    return tomorrowDate;
  }, [activeTab, currentDate, tomorrowDate]);

  const availableData = useMemo(() => {
    if (activeTab === "today") return dataToday;
    return dataTomorrow;
  }, [activeTab, dataToday, dataTomorrow]);

  const baseAvailable = availableData?.availableMinutes || 0;

  const currentAvailable = useMemo(() => {
    const getTaskDailyUsage = (t?: { estimatedMinutes?: number | null; actualMinutes?: number | null; isSplittable?: boolean; maxDailyDuration?: number | null }) => {
      if (!t) return 0;
      const est = t.estimatedMinutes || 0;
      const act = t.actualMinutes || 0;
      const rem = Math.max(0, est - act);
      if (t.isSplittable && t.maxDailyDuration && t.maxDailyDuration > 0) {
        return Math.min(t.maxDailyDuration, rem > 0 ? rem : est);
      }
      return rem > 0 ? rem : est;
    };

    let usedTime = 0;
    if (isPlanningMode) {
      const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
      usedTime = plannedTasks.reduce((acc, t) => acc + getTaskDailyUsage(t), 0);
    } else {
      // In execution mode (overview/confirmed), deduct the tasks in the plan
      const planTasks = currentPlan?.tasks || [];
      usedTime = planTasks.reduce((acc, pt) => acc + getTaskDailyUsage(pt.task), 0);
    }
    return baseAvailable - usedTime;
  }, [isPlanningMode, baseAvailable, plannedTaskIds, tasks, currentPlan]);

  const { batchSlack } = useBatchSlack();
  const [slackTimes, setSlackTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isPlanningMode && plannedTaskIds.length > 0) {
      batchSlack(plannedTaskIds).then(res => {
        if (res) setSlackTimes(res);
      });
    }
  }, [isPlanningMode, plannedTaskIds, batchSlack]);

  const doSavePlan = async () => {
    try {
      const planTasks = plannedTaskIds.map((id, index) => {
        const task = tasks.find(t => t.id === id);
        return {
          taskId: id,
          isMit: task ? task.isImportant : false,
          sortOrder: index,
        };
      });

      const data = await activePlanHook.savePlan({
        availableMinutes: baseAvailable,
        tasks: planTasks,
      });

      setPlanningMode(false);
      setIsOverloadModalOpen(false);
      if (activeTab === "today") {
        useBoardStore.setState({ isStarted: data?.isConfirmed ?? false });
      }
      toast.success(t.board.savePlanSuccess);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t.board.savePlanError;
      toast.error(message);
    }
  };

  const handleSavePlan = async () => {
    if (currentAvailable < 0) {
      setIsOverloadModalOpen(true);
      return;
    }
    await doSavePlan();
  };

  const handleCancelPlan = async () => {
    await activePlanHook.cancelPlan();
    setPlanningMode(false);
    useBoardStore.setState({ plannedTaskIds: [] });
    if (activeTab === "today") {
      useBoardStore.setState({ isStarted: false });
    }
    setIsCancelModalOpen(false);
  };

  const handleRemoveExcessTasks = async () => {
    if (!currentPlan || !currentTimeBlocks || !user?.sleepTime || !user?.wakeTime) return;

    const planDate = new Date(currentPlan.planDate);
    const [sh, sm] = user.sleepTime.split(":").map(Number);
    const [wh, wm] = user.wakeTime.split(":").map(Number);

    const sleepDate = new Date(planDate);
    sleepDate.setHours(sh, sm, 0, 0);

    if (sh < wh || (sh === wh && sm < wm)) {
      sleepDate.setDate(sleepDate.getDate() + 1);
    }

    const excessTaskIds = new Set<string>();
    currentTimeBlocks.forEach(tb => {
      const endTime = new Date(tb.endTime);
      if (endTime > sleepDate) {
        excessTaskIds.add(tb.taskId);
      }
    });

    if (excessTaskIds.size === 0) {
      toast.info(t.board.excessTasksNone);
      return;
    }

    const updatedBlocks = currentTimeBlocks
      .filter(tb => !excessTaskIds.has(tb.taskId))
      .map(tb => ({
        taskId: tb.taskId,
        startTime: tb.startTime,
        endTime: tb.endTime,
        partIndex: tb.partIndex,
        totalParts: tb.totalParts,
      }));

    const updatedPlanTasks = currentPlan.tasks
      .filter(pt => !excessTaskIds.has(pt.task.id))
      .map((pt, idx) => ({
        taskId: pt.task.id,
        isMit: pt.isMit,
        sortOrder: idx,
      }));

    try {
      await fetchClient.post('time-blocks/batch', { targetDate, blocks: updatedBlocks });

      await activePlanHook.savePlan({
        availableMinutes: baseAvailable,
        tasks: updatedPlanTasks,
      });

      queryClient.invalidateQueries({ queryKey: ["dailyPlan", targetDate] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      toast.success(t.board.excessTasksRemovedSuccess(excessTaskIds.size));
    } catch (err) {
      console.error(err);
      toast.error(t.board.savePlanError);
    }
  };

  return {
    tasks,
    dailyPlanToday,
    dailyPlanTomorrow,
    isPlanningMode,
    planningTarget,
    setPlanningMode,
    plannedTaskIds,
    removePlannedTaskLocally,
    isStarted,
    activeTab,
    setActiveTab,
    isCancelModalOpen,
    setIsCancelModalOpen,
    isStartMyDayOpen,
    setIsStartMyDayOpen,
    isOverloadModalOpen,
    setIsOverloadModalOpen,
    currentPlan,
    currentTimeBlocks,
    targetDate,
    currentAvailable,
    totalAvailable: baseAvailable,
    availableData,
    slackTimes,
    handleSavePlan,
    doSavePlan,
    handleCancelPlan,
    handleRemoveExcessTasks,
  };
}
