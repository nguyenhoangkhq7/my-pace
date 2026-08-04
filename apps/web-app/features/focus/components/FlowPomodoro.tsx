import { useState, useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import type { Task, DailyPlan, DailyPlanTask } from "@/features/board/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Check, ListTodo, Eye, EyeOff } from "lucide-react";
import { shiftTimeBlocks } from "@/features/board/utils/timeShift";
import type { TaskTimeBlock } from "@/features/board/types";
import { useTaskTimeBlocks } from "@/features/board/hooks/useTaskTimeBlocks";

import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FlowEmptyState } from "@/features/focus/components/FlowEmptyState";
import { PomodoroTimerDisplay } from "@/features/focus/components/PomodoroTimerDisplay";
import { TaskNotesPanel } from "@/features/focus/components/TaskNotesPanel";
import { ChecklistModal } from "@/features/focus/components/ChecklistModal";

function FocusedStatsDisplay() {
  const accumulatedFocusTime = useFocusStore((s) => s.accumulatedFocusTime);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);

  return (
    <div className="mt-6 text-sm flex flex-col items-center gap-2 shrink-0">
      <div className={cn(
        "text-[11px] lg:text-xs font-bold uppercase tracking-[0.2em]",
        isVideoBackground ? "text-white/80 drop-shadow-xs" : "text-muted-foreground"
      )}>
        FOCUSED: <span className={cn("ml-1 font-mono", isVideoBackground ? "text-white font-bold" : "text-foreground")}>{Math.floor(accumulatedFocusTime / 60)} MIN</span>
      </div>
      {pomodoroState === "finished" && (
        <div className="text-amber-300 mt-2 text-center max-w-sm bg-amber-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-400/30 font-medium text-xs md:text-sm">
          Time is up! Keep working or mark as complete.
        </div>
      )}
    </div>
  );
}

export function FlowPomodoro() {
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const activePlanTaskId = useFocusStore((s) => s.activePlanTaskId);
  const closeFocusMode = useFocusStore((s) => s.closeFocusMode);
  const startTimer = useFocusStore((s) => s.startTimer);
  const pauseTimer = useFocusStore((s) => s.pauseTimer);
  const pomodoroState = useFocusStore((s) => s.pomodoroState);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => fetchClient.get<Task[]>('tasks').then(r => r.data) });
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', todayStr], queryFn: () => fetchClient.get<DailyPlan>(`daily-plans/${todayStr}`).then(r => r.data) });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Task> }) => fetchClient.put(`tasks/${id}`, data).then(r => r.data as Task),
    onSuccess: (updatedTask: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.setQueryData(['dailyPlan', todayStr], (old: DailyPlan | undefined) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((pt) =>
            pt.task.id === updatedTask.id
              ? { ...pt, task: { ...pt.task, actualMinutes: updatedTask.actualMinutes } }
              : pt
          ),
        };
      });
    },
  });
  const toggleTaskDoneMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => fetchClient.post(`daily-plans/tasks/${taskId}/toggle`, {}).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
    },
  });
  const { data: timeBlocks = [] } = useTaskTimeBlocks(todayStr, todayStr);

  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => fetchClient.post<TaskTimeBlock[]>('time-blocks/batch', { targetDate: todayStr, blocks }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
    }
  });
  const { refetch: fetchGoals } = useQuery({ queryKey: ['goals'], queryFn: () => fetchClient.get('goals').then(r => r.data), enabled: false });

  const [isFinishing, setIsFinishing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isUiHidden, setIsUiHidden] = useState(false);

  useEffect(() => {
    fetchGoals().catch(console.error);
  }, [fetchGoals]);

  const activeTask = tasks.find((t: Task) => t.id === activeTaskId);

  const realEstimated = activeTask?.estimatedMinutes ?? 25;
  const activeTaskEstimatedMinutes = useFocusStore((s) => s.activeTaskEstimatedMinutes);
  useEffect(() => {
    if (!activeTaskId) return;
    if (realEstimated !== activeTaskEstimatedMinutes) {
      const { focusMinutes: fm, accumulatedFocusTime: aft } = useFocusStore.getState();
      const alreadyWorked = Math.floor(aft / 60);
      const newTotal = Math.max(1, Math.ceil(realEstimated / fm));
      const newCurrent = Math.min(newTotal, Math.floor(alreadyWorked / fm) + 1);
      useFocusStore.setState({
        activeTaskEstimatedMinutes: realEstimated,
        totalSessions: newTotal,
        currentSession: newCurrent,
      });
    }
  }, [realEstimated, activeTaskId, activeTaskEstimatedMinutes]);

  if (!activeTaskId || !activeTask) {
    return <FlowEmptyState />;
  }

  const checklists = activeTask.checklists ?? [];
  const completedChecklistsCount = checklists.filter((c) => c.isCompleted).length;
  const uncompletedCount = checklists.length - completedChecklistsCount;

  const handleCompleteClick = () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;

    if (uncompletedCount > 0) {
      toast.warning(`Còn ${uncompletedCount} subtask chưa hoàn thành. Vui lòng tích hoàn thành toàn bộ subtask trước!`);
      setIsChecklistModalOpen(true);
      return;
    }

    handleComplete();
  };

  const handleComplete = async () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;
    setIsFinishing(true);
    try {
      const { accumulatedFocusTime } = useFocusStore.getState();
      const actualMinutes = Math.floor(accumulatedFocusTime / 60);
      if (actualMinutes > 0) {
        await updateTaskMutation.mutateAsync({ id: activeTaskId, data: { actualMinutes } });
        if (timeBlocks && timeBlocks.length > 0) {
          const estimated = activeTask.estimatedMinutes || 0;
          const shifted = shiftTimeBlocks(timeBlocks, activeTaskId, actualMinutes, estimated);
          await saveTimeBlocksMutation.mutateAsync(shifted);
        }
      } else {
        useFocusStore.getState().setPromptTask({
          id: activeTaskId,
          title: activeTask.title,
          estimatedMinutes: activeTask.estimatedMinutes || 0
        });
      }
      
      await toggleTaskDoneMutation.mutateAsync({ taskId: activePlanTaskId });
      
      pauseTimer();
      
      const freshPlan = queryClient.getQueryData<DailyPlan>(['dailyPlan', todayStr]) || dailyPlanToday;
      const currentTaskIndex = freshPlan?.tasks.findIndex((t: DailyPlanTask) => t.id === activePlanTaskId) ?? -1;
      
      if (freshPlan && currentTaskIndex !== -1) {
        const remainingTasks = freshPlan.tasks.slice(currentTaskIndex + 1).concat(freshPlan.tasks.slice(0, currentTaskIndex));
        const nextTask = remainingTasks.find((t: DailyPlanTask) => t.task.status !== "Done" && t.id !== activePlanTaskId);
        
        if (nextTask) {
          useFocusStore.getState().openFocusMode(nextTask.task.id, nextTask.id, nextTask.task.estimatedMinutes || 25, nextTask.task.actualMinutes || 0);
        } else {
          closeFocusMode();
        }
      } else {
        closeFocusMode();
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const { accumulatedFocusTime } = useFocusStore.getState();
      if (activeTaskId && accumulatedFocusTime > 0) {
        const actualMinutes = Math.round(accumulatedFocusTime / 60);
        await updateTaskMutation.mutateAsync({ id: activeTaskId, data: { actualMinutes } });
      }
    } catch (err) {
      console.error("Failed to save progress on stop:", err);
    } finally {
      setIsStopping(false);
      pauseTimer();
      closeFocusMode();
    }
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col relative overflow-hidden items-center justify-center p-4 transition-colors duration-300",
      isVideoBackground ? "bg-transparent" : "bg-background"
    )}>
      {/* Studio Atmosphere Glows (only when Video Background is off) */}
      {!isVideoBackground && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-indigo-500/5 blur-[130px] rounded-full pointer-events-none" />
        </>
      )}

      {/* 1-Click UI Show/Hide Toggle Button for Video Background */}
      {isVideoBackground && (
        <button
          onClick={() => setIsUiHidden((prev) => !prev)}
          className={cn(
            "absolute top-4 right-4 z-30 p-2 rounded-xl border transition-all duration-300 cursor-pointer shadow-md",
            isUiHidden
              ? "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 animate-pulse"
              : "bg-black/40 backdrop-blur-md border-white/15 text-white/70 hover:text-white hover:bg-black/60"
          )}
          title={isUiHidden ? "Hiện giao diện Pomodoro" : "Ẩn bớt giao diện để thưởng thức Video Nền"}
        >
          {isUiHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}

      <div className={cn(
        "w-full max-w-xl flex flex-col items-center relative z-10 px-4 h-full py-2 sm:py-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden justify-between transition-all duration-500",
        isUiHidden ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
      )}>
        <PomodoroTimerDisplay activeTask={activeTask} />

        {/* Action Controls Bar */}
        <div className="mt-8 lg:mt-10 xl:mt-12 flex items-center justify-center gap-5 lg:gap-7 xl:gap-8 shrink-0">
          {/* Stop Button */}
          <Button 
            variant="outline" 
            size="icon" 
            disabled={isStopping}
            className={cn(
              "w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-2xl transition-all shadow-lg group disabled:opacity-60 cursor-pointer",
              isVideoBackground
                ? "bg-black/45 backdrop-blur-md border-white/20 text-white hover:bg-black/65 shadow-[0_8px_25px_rgba(0,0,0,0.4)]"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={handleStop}
            title="Dừng task"
          >
            {isStopping
              ? <span className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Square fill="currentColor" strokeWidth={2.5} className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 group-hover:scale-95 transition-transform" />}
          </Button>

          {/* Subtasks Modal Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-2xl transition-all shadow-lg group relative cursor-pointer",
              isVideoBackground
                ? "bg-black/45 backdrop-blur-md border-indigo-300/40 text-indigo-300 hover:bg-black/65 shadow-[0_8px_25px_rgba(0,0,0,0.4)]"
                : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50"
            )}
            onClick={() => setIsChecklistModalOpen(true)}
            title="Danh sách Subtask"
          >
            <ListTodo strokeWidth={2.5} className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 group-hover:scale-110 transition-transform" />
            {checklists.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] sm:text-xs font-bold rounded-full h-5 sm:h-6 min-w-[20px] sm:min-w-[24px] px-1 flex items-center justify-center border-2 border-background shadow-xs">
                {completedChecklistsCount}/{checklists.length}
              </span>
            )}
          </Button>

          {/* Start / Pause Main Button */}
          {pomodoroState === "idle" || pomodoroState === "finished" || pomodoroState === "paused" ? (
             <Button 
               size="icon" 
               className={cn(
                 "w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-2xl text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-xl relative overflow-hidden group/btn shrink-0",
                 isVideoBackground
                   ? "bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-500 backdrop-blur-xl border-2 border-white/40 shadow-[0_0_35px_rgba(99,102,241,0.6)]"
                   : "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 hover:from-indigo-400 hover:to-violet-600 shadow-[0_0_35px_rgba(99,102,241,0.5)] border-2 border-indigo-400/40"
               )}
               onClick={startTimer}
               title="Bắt đầu"
             >
               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-2xl" />
               <Play fill="currentColor" strokeWidth={2.5} className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 ml-0.5 group-hover/btn:scale-110 transition-transform" />
             </Button>
          ) : (
            <Button 
               size="icon" 
               className={cn(
                 "w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-2xl text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-xl relative overflow-hidden group/btn shrink-0",
                 isVideoBackground
                   ? "bg-gradient-to-br from-amber-500 via-orange-600 to-amber-600 backdrop-blur-xl border-2 border-amber-300/60 shadow-[0_0_35px_rgba(245,158,11,0.6)]"
                   : "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-[0_0_35px_rgba(245,158,11,0.5)] border-2 border-amber-300/40"
               )}
               onClick={pauseTimer}
               title="Tạm dừng"
             >
               <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-2xl" />
               <Pause fill="currentColor" strokeWidth={2.5} className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-white group-hover/btn:scale-110 transition-transform" />
             </Button>
          )}

          {/* Complete Task Button */}
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-2xl transition-all shadow-lg group cursor-pointer",
              isVideoBackground
                ? "bg-black/45 backdrop-blur-md border-emerald-300/40 text-emerald-300 hover:bg-black/65 shadow-[0_8px_25px_rgba(0,0,0,0.4)]"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            )}
            onClick={handleCompleteClick}
            disabled={isFinishing}
            title="Hoàn thành task"
          >
            <Check strokeWidth={3} className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
        
        {/* Focused stats & alert */}
        <FocusedStatsDisplay />

        {/* Task Notes Panel */}
        <TaskNotesPanel task={activeTask} />

        <ChecklistModal
          isOpen={isChecklistModalOpen}
          onOpenChange={setIsChecklistModalOpen}
          activeTask={activeTask}
          onAllCompleted={handleCompleteClick}
        />
      </div>
    </div>
  );
}
