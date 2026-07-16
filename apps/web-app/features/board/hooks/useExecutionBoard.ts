import { useState, useMemo } from "react";
import { toast } from "sonner";
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
    let usedTime = 0;
    if (isPlanningMode) {
      const plannedTasks = tasks.filter(t => plannedTaskIds.includes(t.id));
      usedTime = plannedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    } else {
      // In execution mode (overview/confirmed), deduct the tasks in the plan
      const planTasks = currentPlan?.tasks || [];
      usedTime = planTasks.reduce((acc, pt) => acc + (pt.task?.estimatedMinutes || 0), 0);
    }
    return baseAvailable - usedTime;
  }, [isPlanningMode, baseAvailable, plannedTaskIds, tasks, currentPlan]);

  const handleSavePlan = async () => {
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
        availableMinutes: Math.max(0, currentAvailable),
        tasks: planTasks,
      });

      setPlanningMode(false);
      if (activeTab === "today") {
        useBoardStore.setState({ isStarted: data?.isConfirmed ?? false });
      }
      toast.success("Lưu kế hoạch thành công!");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Không thể lưu kế hoạch. Vui lòng thử lại!";
      toast.error(message);
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
    totalAvailable: baseAvailable,
    availableData,
    handleSavePlan,
    handleCancelPlan,
  };
}
