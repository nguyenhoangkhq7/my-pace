import { useState, useMemo } from "react";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeQuery } from "@/features/available-time/hooks/useAvailableTime";

import { useTasks } from "./useTasks";
import { useDailyPlan } from "./useDailyPlan";

interface UseExecutionBoardProps {
  currentDate: string;
  tomorrowDate: string;
}

export function useExecutionBoard({ currentDate, tomorrowDate }: UseExecutionBoardProps) {

  const { 
    isPlanningMode, 
    planningTarget,
    setPlanningMode, 
    plannedTaskIds, 
    removePlannedTaskLocally,
    isStarted
  } = useBoardStore();

  const { tasks } = useTasks();
  const todayPlan = useDailyPlan(currentDate);
  const tomorrowPlan = useDailyPlan(tomorrowDate);

  const dailyPlanToday = todayPlan.dailyPlan;
  const dailyPlanTomorrow = tomorrowPlan.dailyPlan;

  const { data: dataToday } = useAvailableTimeQuery(currentDate);
  const { data: dataTomorrow } = useAvailableTimeQuery(tomorrowDate);
  const [activeTab, setActiveTab] = useState("today");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStartMyDayOpen, setIsStartMyDayOpen] = useState(false);

  const activePlanHook = activeTab === "today" ? todayPlan : tomorrowPlan;
  const currentPlan = activeTab === "today" ? dailyPlanToday : dailyPlanTomorrow;
  const targetDate = activeTab === "today" ? currentDate : tomorrowDate;

  // Time calculations
  const availableData = activeTab === "today" ? dataToday : dataTomorrow;
  const baseAvailable = availableData?.availableMinutes || 0;

  const currentAvailable = useMemo(() => {
    if (!isPlanningMode) {
      return baseAvailable;
    }
    
    // In planning mode, deduct the sum of planned tasks
    const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
    const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    return Math.max(0, baseAvailable - usedTime);
  }, [isPlanningMode, baseAvailable, plannedTaskIds, tasks]);

  const handleSavePlan = async () => {
    const planTasks = plannedTaskIds.map((id, index) => {
      const task = tasks.find(t => t.id === id);
      return {
        taskId: id,
        isMit: task ? task.isImportant : false,
        sortOrder: index,
      };
    });

    const data = await activePlanHook.savePlan({
      availableMinutes: currentAvailable,
      tasks: planTasks,
    });

    setPlanningMode(false);
    if (activeTab === "today") {
      useBoardStore.setState({ isStarted: data?.isConfirmed ?? false });
    }
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
    currentPlan,
    targetDate,
    currentAvailable,
    availableData,
    handleSavePlan,
    handleCancelPlan,
  };
}
