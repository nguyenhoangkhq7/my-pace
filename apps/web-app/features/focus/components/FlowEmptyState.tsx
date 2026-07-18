import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBoardStore } from "@/features/board/store/board.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasksAction, updateTaskAction } from "@/features/board/actions/task.action";
import { getDailyPlanAction, planMyDayAction, reviewPlanAction } from "@/features/board/actions/plan.action";
import { saveTimeBlocksAction } from "@/features/board/actions/timeblock.action";
import type { TaskTimeBlock } from "@/features/board/types";
import { useAvailableTimeQuery } from "@/features/available-time/hooks/useAvailableTime";
import { toast } from "sonner";
import type { Task, DailyPlanTask } from "@/features/board/types";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { FlowReviewModal } from "./FlowReviewModal";
import { FlowPickTaskModal } from "./FlowPickTaskModal";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthStore } from "@/features/auth";
import { getEventsAction } from "@/features/calendar/actions/calendar.action";
import { autoSchedule, type OccupiedSlot } from "@/features/board/utils/autoSchedule";
import { getTodayStr } from "@/lib/date";

const toLocalDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toLocalTimeStr = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function FlowEmptyState() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);
  
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: getTasksAction });
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', todayStr], queryFn: () => getDailyPlanAction(todayStr) });
  
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Task> }) => updateTaskAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const savePlanMutation = useMutation({
    mutationFn: ({ planDate, availableMinutes, tasks }: { planDate: string; availableMinutes: number; tasks: Array<{ taskId: string; isMit: boolean; sortOrder: number }> }) =>
      planMyDayAction({
        planDate,
        availableMinutes,
        tasks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => saveTimeBlocksAction({ dailyPlanId: dailyPlanToday!.id, blocks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
    },
  });
  const reviewDailyPlanMutation = useMutation({
    mutationFn: reviewPlanAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyPlan'] }),
  });
  const { data: dataToday } = useAvailableTimeQuery(todayStr);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isPickTaskModalOpen, setIsPickTaskModalOpen] = useState(false);
  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);

  const allDone = !!dailyPlanToday?.tasks && dailyPlanToday.tasks.length > 0 && dailyPlanToday.tasks.every(t => t.task.status === "Done");

  if (allDone) {
    const totalMinutes = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.actualMinutes || 0), 0);
    const totalEstimated = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.estimatedMinutes || 0), 0);
    const completedCount = dailyPlanToday.tasks.length;
    const isReviewed = dailyPlanToday?.isReviewed || false;
    const remainingMinutes = dataToday?.availableMinutes ?? 0;

    const backlogTasks = tasks.filter(
      (t) => t.status !== "Done" && !dailyPlanToday.tasks.some((pt) => pt.task.id === t.id)
    );

    const addAndSaveTask = async (task: Task) => {
      if (isAddingTask) return;
      setIsAddingTask(true);

      const currentPlannedIds = dailyPlanToday.tasks.map((pt) => pt.task.id);
      const updatedIds = [...currentPlannedIds, task.id];

      useBoardStore.setState({ plannedTaskIds: updatedIds });

      const tasksPayload = updatedIds.map((taskId, index) => {
        const existingTask = dailyPlanToday.tasks.find(pt => pt.task.id === taskId);
        return {
          taskId,
          isMit: existingTask ? existingTask.isMit : false,
          sortOrder: index,
        };
      });

      try {
        await savePlanMutation.mutateAsync({
          planDate: dailyPlanToday.planDate,
          availableMinutes: dailyPlanToday.availableMinutes,
          tasks: tasksPayload,
        });

        const { user } = useAuthStore.getState();

        if (user?.wakeTime && user?.sleepTime) {
          const fixedEvents = await getEventsAction(todayStr, todayStr);
          const occupiedSlots: OccupiedSlot[] = fixedEvents.map((event) => ({
            date: event.occurrenceDate,
            startTime: event.startTime.substring(0, 5),
            endTime: event.endTime.substring(0, 5),
          }));
          
          const existingBlocks = dailyPlanToday.timeBlocks.map((block) => ({
            date: toLocalDateStr(block.startTime),
            startTime: toLocalTimeStr(block.startTime),
            endTime: toLocalTimeStr(block.endTime),
          }));

          const newDailyPlanTask: DailyPlanTask = {
            id: "",
            task: task,
            isMit: false,
            sortOrder: dailyPlanToday.tasks.length,
            dailyPlanId: dailyPlanToday.id
          };
          const blocks = autoSchedule(
            [newDailyPlanTask],
            [...occupiedSlots, ...existingBlocks],
            dailyPlanToday.id,
            todayStr,
            user.wakeTime,
            user.sleepTime,
            user.timezone
          );

          if (blocks.length > 0) {
            await saveTimeBlocksMutation.mutateAsync([...dailyPlanToday.timeBlocks, ...blocks] as Omit<TaskTimeBlock, 'id'>[]);
          }
        }

        setIsReviewModalOpen(false); // Close review modal on successful add
        toast.success(
          locale === "vi"
            ? `Đã thêm công việc "${task.title}" vào kế hoạch hôm nay!`
            : `Added task "${task.title}" to today's plan!`
        );
      } catch (err) {
        console.error(err);
        toast.error(
          locale === "vi"
            ? "Không thể thêm công việc vào kế hoạch."
            : "Could not add task to today's plan."
        );
      } finally {
        setIsAddingTask(false);
      }
    };

    const handlePickTask = async (task: Task) => {
      if (!task.estimatedMinutes) {
        setRequireDurationForTask(task);
        return;
      }
      await addAndSaveTask(task);
    };

    const handleDurationSubmit = async (taskData: Partial<Task>) => {
      if (!requireDurationForTask) return;
      
      try {
        const estimatedMinutes = taskData.estimatedMinutes ?? 0;
        // Update task duration in DB
        await updateTaskMutation.mutateAsync({ id: requireDurationForTask.id, data: { estimatedMinutes } });
        const updatedTask = { ...requireDurationForTask, estimatedMinutes };
        setRequireDurationForTask(undefined);
        // Add updated task to daily plan
        await addAndSaveTask(updatedTask);
      } catch (err) {
        console.error(err);
        toast.error(
          locale === "vi"
            ? "Không thể cập nhật thời gian cho công việc."
            : "Could not update task duration."
        );
      }
    };

    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-6 relative w-full overflow-y-auto scrollbar-thin">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-background to-background pointer-events-none"></div>
        
        <div className="max-w-md text-center space-y-6 relative z-10 flex flex-col items-center w-full py-8">
          {isReviewed ? (
            <div className="space-y-4">
              <svg className="w-16 h-16 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-3xl font-black text-foreground tracking-wide">{t.flow.great}</h2>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                {t.flow.allTasksDone}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <svg className="w-16 h-16 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h2 className="text-3xl font-black text-foreground tracking-wide">{t.flow.planCompleted}</h2>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                {t.flow.lookBack}
              </p>
              <Button onClick={() => setIsReviewModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-full mt-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer">
                {t.flow.endOfDayReview}
              </Button>
            </div>
          )}
        </div>

        <FlowReviewModal
          isOpen={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          completedCount={completedCount}
          totalMinutes={totalMinutes}
          totalEstimated={totalEstimated}
          remainingMinutes={remainingMinutes}
          backlogTasks={backlogTasks}
          onReviewConfirm={() => {
            setIsReviewModalOpen(false);
            if (dailyPlanToday) {
              reviewDailyPlanMutation.mutateAsync(dailyPlanToday.planDate);
            }
          }}
          onPickTaskClick={() => setIsPickTaskModalOpen(true)}
        />

        <FlowPickTaskModal
          isOpen={isPickTaskModalOpen}
          onOpenChange={setIsPickTaskModalOpen}
          backlogTasks={backlogTasks}
          onPickTask={handlePickTask}
        />

        {/* Modal to prompt for estimated duration if missing */}
        <TaskFormModal 
          isOpen={!!requireDurationForTask} 
          onClose={() => setRequireDurationForTask(undefined)} 
          onSubmit={handleDurationSubmit}
          initialData={requireDurationForTask}
          requireDuration={true}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background p-6 relative w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/15 via-background to-background pointer-events-none"></div>
      <div className="max-w-md text-center space-y-6 relative z-10">
        <svg className="w-16 h-16 text-muted-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-foreground tracking-wide">{t.flow.readyToFocus}</h2>
        <p className="text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
          {t.flow.selectLeftTask}
        </p>
      </div>
    </div>
  );
}
