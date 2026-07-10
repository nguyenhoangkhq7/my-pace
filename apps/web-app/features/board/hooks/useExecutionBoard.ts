import { useState, useMemo } from "react";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";

interface UseExecutionBoardProps {
  currentDate: string;
  tomorrowDate: string;
}

export function useExecutionBoard({ currentDate, tomorrowDate }: UseExecutionBoardProps) {
  const { 
    tasks, 
    dailyPlanToday, 
    dailyPlanTomorrow,
    isPlanningMode, 
    planningTarget,
    setPlanningMode, 
    plannedTaskIds, 
    removePlannedTaskLocally,
    savePlan,
    cancelPlan,
    isStarted
  } = useBoardStore();

  const { dataToday, dataTomorrow } = useAvailableTimeStore();
  const [activeTab, setActiveTab] = useState("today");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStartMyDayOpen, setIsStartMyDayOpen] = useState(false);

  const currentPlan = activeTab === "today" ? dailyPlanToday : dailyPlanTomorrow;
  const targetDate = activeTab === "today" ? currentDate : tomorrowDate;

  // Time calculations
  const baseAvailable = (activeTab === "today" ? dataToday?.availableMinutes : dataTomorrow?.availableMinutes) || 0;

  const currentAvailable = useMemo(() => {
    if (!isPlanningMode) {
      return currentPlan ? currentPlan.availableMinutes : baseAvailable;
    }
    
    // In planning mode, deduct the sum of planned tasks
    const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
    const usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    return Math.max(0, baseAvailable - usedTime);
  }, [isPlanningMode, baseAvailable, currentPlan, plannedTaskIds, tasks]);

  const handleSavePlan = () => {
    savePlan(targetDate, currentAvailable, activeTab as 'today' | 'tomorrow');
  };

  const handleCancelPlan = () => {
    cancelPlan(targetDate, activeTab as 'tomorrow' | 'today');
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
    handleSavePlan,
    handleCancelPlan,
  };
}
