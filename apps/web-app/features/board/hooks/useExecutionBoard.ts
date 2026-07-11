import { useState, useMemo } from "react";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

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

  const handleSavePlan = () => {
    savePlan(targetDate, currentAvailable, activeTab as 'today' | 'tomorrow');
    const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore.getState();
    if (isTourActive && tourStepIndex === 7) {
      setTimeout(() => advanceTourStep(), 400); // Wait for modal animation
    }
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
    availableData,
    handleSavePlan,
    handleCancelPlan,
  };
}
