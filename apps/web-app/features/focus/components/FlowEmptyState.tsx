import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useBoardStore } from "@/features/board/store/board.store";
import { useAvailableTimeStore } from "@/features/available-time/store/available-time.store";
import { toast } from "sonner";
import type { Task } from "@/features/board/types";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthStore } from "@/features/auth";
import { calendarApi } from "@/features/calendar/api/calendar.api";
import { autoSchedule, type OccupiedSlot } from "@/features/board/utils/autoSchedule";

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
  const { tasks, dailyPlanToday, savePlan, updateTask, reviewDailyPlan, saveTimeBlocks } = useBoardStore();
  const { dataToday } = useAvailableTimeStore();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isPickTaskModalOpen, setIsPickTaskModalOpen] = useState(false);
  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);

  const allDone = !!dailyPlanToday?.tasks && dailyPlanToday.tasks.length > 0 && dailyPlanToday.tasks.every(t => t.task.status === "Done");

  // Periodic available time refresh on Flow completion screen to keep it ticking in real-time
  useEffect(() => {
    if (!allDone) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    // Refresh immediately
    useAvailableTimeStore.getState().fetchAvailableTimeToday(today);
    
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        useAvailableTimeStore.getState().fetchAvailableTimeToday(today);
      }
    }, 15000); // refresh every 15s
    
    return () => clearInterval(interval);
  }, [allDone]);

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

      try {
        await savePlan(dailyPlanToday.planDate, dailyPlanToday.availableMinutes, "today");

        const { user } = useAuthStore.getState();
        
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (user?.wakeTime && user?.sleepTime) {
          const { data: fixedEvents } = await calendarApi.getEvents(todayStr, todayStr);
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

          const newDailyPlanTask = { task: task, isCompleted: false, orderIndex: dailyPlanToday.tasks.length, dailyPlanId: dailyPlanToday.id };
          const blocks = autoSchedule(
            [newDailyPlanTask as any],
            [...occupiedSlots, ...existingBlocks],
            dailyPlanToday.id,
            todayStr,
            user.wakeTime,
            user.sleepTime
          );

          if (blocks.length > 0) {
            await saveTimeBlocks([...dailyPlanToday.timeBlocks, ...blocks]);
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
        await updateTask(requireDurationForTask.id, { estimatedMinutes });
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

        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card text-foreground border-border shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center font-bold tracking-wide">{t.flow.summaryTitle}</DialogTitle>
              <DialogDescription className="text-center pt-2 text-muted-foreground font-medium">
                {t.flow.summaryDesc}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="bg-indigo-950/10 border border-indigo-500/20 hover:border-indigo-500/30 transition-all rounded-2xl p-5 text-center">
                <div className="text-5xl font-black text-indigo-400 mb-2 drop-shadow-md">{completedCount}</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.tasksDone}</div>
              </div>
              <div className="bg-emerald-950/10 border border-emerald-500/20 hover:border-emerald-500/30 transition-all rounded-2xl p-5 text-center">
                <div className="text-5xl font-black text-emerald-400 mb-2 drop-shadow-md">{totalMinutes}</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.focusMinutes}</div>
              </div>
              <div className="bg-cyan-950/10 border border-cyan-500/20 hover:border-cyan-500/30 transition-all rounded-2xl p-5 text-center col-span-2">
                <div className="text-3xl font-bold text-cyan-400 mb-2 drop-shadow-sm">{totalEstimated}m</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.flow.estimatedTime}</div>
              </div>
            </div>

            <div className="text-center text-xs italic text-muted-foreground/80 font-medium max-w-sm mx-auto leading-relaxed pb-4 px-4">
              {t.flow.quote}
            </div>

            {/* Elegant inline task picker prompting relaxation or extra tasks */}
            {backlogTasks.length > 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-1 pb-2 pt-4 border-t border-border mt-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {t.flow.takeRest}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.flow.remainingPrompt(remainingMinutes)}
                  <span 
                    onClick={() => setIsPickTaskModalOpen(true)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline decoration-dotted underline-offset-4 transition-colors"
                  >
                    {t.flow.addTaskLink}
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground font-medium pt-2 mt-2">
                {t.flow.allDoneLetRest}
              </div>
            )}

            <DialogFooter className="flex justify-center sm:justify-center border-t border-border pt-5 mt-4">
              <Button 
                onClick={() => {
                  setIsReviewModalOpen(false);
                  if (dailyPlanToday) {
                    reviewDailyPlan(dailyPlanToday.planDate);
                  }
                }} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white w-full rounded-full font-bold shadow-[0_4px_20px_rgba(79,70,229,0.35)] h-12 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {t.flow.closeBtn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Beautiful Pick Task from Backlog Modal */}
        <Dialog open={isPickTaskModalOpen} onOpenChange={setIsPickTaskModalOpen}>
          <DialogContent className="sm:max-w-[420px] bg-slate-950 text-slate-50 border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold">{t.flow.addTaskToday}</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                {t.flow.selectBacklogTask}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {backlogTasks.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => {
                    setIsPickTaskModalOpen(false);
                    handlePickTask(task);
                  }}
                  className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all duration-200 group active:scale-[0.98]"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                      {task.title}
                    </div>
                    {task.estimatedMinutes && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{task.estimatedMinutes} {t.flow.minutesUnit}</div>
                    )}
                  </div>
                  <button className="text-[10px] font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2.5 py-1 rounded-lg shrink-0 transition-colors">
                    {t.flow.addBtn}
                  </button>
                </div>
              ))}
            </div>

            <DialogFooter className="border-t border-slate-800/60 pt-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsPickTaskModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-900 w-full rounded-xl text-xs h-9 cursor-pointer"
              >
                {t.flow.cancelBtn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
