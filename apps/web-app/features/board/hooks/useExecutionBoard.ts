import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useBoardStore } from "../store/board.store";
import { useAvailableTimeQuery } from "@/features/available-time/hooks/useAvailableTime";
import { useAuthStore } from "@/features/auth";
import { saveTimeBlocksAction } from "../actions/timeblock.action";

import { useTasks } from "./useTasks";
import { useDailyPlan } from "./useDailyPlan";

interface UseExecutionBoardProps {
  currentDate: string;
  tomorrowDate: string;
  day2Date: string;
  day3Date: string;
}

export function useExecutionBoard({ currentDate, tomorrowDate, day2Date, day3Date }: UseExecutionBoardProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { 
    isPlanningMode, 
    planningTarget,
    setPlanningMode, 
    plannedTaskIds, 
    removePlannedTaskLocally,
  } = useBoardStore();

  const { tasks } = useTasks();
  const todayPlan = useDailyPlan(currentDate);
  const tomorrowPlan = useDailyPlan(tomorrowDate);
  const day2Plan = useDailyPlan(day2Date);
  const day3Plan = useDailyPlan(day3Date);

  const dailyPlanToday = todayPlan.dailyPlan;
  const dailyPlanTomorrow = tomorrowPlan.dailyPlan;
  const dailyPlanDay2 = day2Plan.dailyPlan;
  const dailyPlanDay3 = day3Plan.dailyPlan;
  
  const isStarted = dailyPlanToday?.isConfirmed ?? false;

  const { data: dataToday } = useAvailableTimeQuery(currentDate);
  const { data: dataTomorrow } = useAvailableTimeQuery(tomorrowDate);
  const { data: dataDay2 } = useAvailableTimeQuery(day2Date);
  const { data: dataDay3 } = useAvailableTimeQuery(day3Date);

  const [activeTab, setActiveTab] = useState("today");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isStartMyDayOpen, setIsStartMyDayOpen] = useState(false);

  const activePlanHook = useMemo(() => {
    if (activeTab === "today") return todayPlan;
    if (activeTab === "tomorrow") return tomorrowPlan;
    if (activeTab === "day2") return day2Plan;
    return day3Plan;
  }, [activeTab, todayPlan, tomorrowPlan, day2Plan, day3Plan]);

  const currentPlan = useMemo(() => {
    if (activeTab === "today") return dailyPlanToday;
    if (activeTab === "tomorrow") return dailyPlanTomorrow;
    if (activeTab === "day2") return dailyPlanDay2;
    return dailyPlanDay3;
  }, [activeTab, dailyPlanToday, dailyPlanTomorrow, dailyPlanDay2, dailyPlanDay3]);

  const targetDate = useMemo(() => {
    if (activeTab === "today") return currentDate;
    if (activeTab === "tomorrow") return tomorrowDate;
    if (activeTab === "day2") return day2Date;
    return day3Date;
  }, [activeTab, currentDate, tomorrowDate, day2Date, day3Date]);

  const availableData = useMemo(() => {
    if (activeTab === "today") return dataToday;
    if (activeTab === "tomorrow") return dataTomorrow;
    if (activeTab === "day2") return dataDay2;
    return dataDay3;
  }, [activeTab, dataToday, dataTomorrow, dataDay2, dataDay3]);

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

  const handleRemoveExcessTasks = async () => {
    if (!currentPlan || !currentPlan.timeBlocks || !user?.sleepTime || !user?.wakeTime) return;

    const planDate = new Date(currentPlan.planDate);
    const [sh, sm] = user.sleepTime.split(":").map(Number);
    const [wh, wm] = user.wakeTime.split(":").map(Number);

    const sleepDate = new Date(planDate);
    sleepDate.setHours(sh, sm, 0, 0);

    if (sh < wh || (sh === wh && sm < wm)) {
      sleepDate.setDate(sleepDate.getDate() + 1);
    }

    const excessTaskIds = new Set<string>();
    currentPlan.timeBlocks.forEach(tb => {
      const endTime = new Date(tb.endTime);
      if (endTime > sleepDate) {
        excessTaskIds.add(tb.taskId);
      }
    });

    if (excessTaskIds.size === 0) {
      toast.info("Không có công việc nào vượt quá giờ đi ngủ.");
      return;
    }

    const updatedBlocks = currentPlan.timeBlocks
      .filter(tb => !excessTaskIds.has(tb.taskId))
      .map(tb => ({
        taskId: tb.taskId,
        dailyPlanId: tb.dailyPlanId,
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
      await saveTimeBlocksAction({ dailyPlanId: currentPlan.id, blocks: updatedBlocks });

      await activePlanHook.savePlan({
        availableMinutes: baseAvailable,
        tasks: updatedPlanTasks,
      });

      queryClient.invalidateQueries({ queryKey: ["dailyPlan", targetDate] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      toast.success(`Đã tự động đẩy ${excessTaskIds.size} công việc thừa về Backlog.`);
    } catch (err) {
      console.error(err);
      toast.error("Không thể xử lý công việc thừa. Vui lòng thử lại.");
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
    currentPlan,
    targetDate,
    currentAvailable,
    totalAvailable: baseAvailable,
    availableData,
    handleSavePlan,
    handleCancelPlan,
    handleRemoveExcessTasks,
  };
}
