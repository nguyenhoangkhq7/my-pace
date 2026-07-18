import { useState, useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import type { Task, DailyPlan, DailyPlanTask } from "@/features/board/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasksAction, updateTaskAction } from "@/features/board/actions/task.action";
import { getDailyPlanAction, toggleTaskDoneAction } from "@/features/board/actions/plan.action";
import { getGoalsAction } from "@/features/goal/actions/goal.action";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Check, ListTodo } from "lucide-react";
import { saveTimeBlocksAction } from "@/features/board/actions/timeblock.action";
import { shiftTimeBlocks } from "@/features/board/utils/timeShift";
import type { TaskTimeBlock } from "@/features/board/types";

import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import { FlowEmptyState } from "@/features/focus/components/FlowEmptyState";
import { PomodoroTimerDisplay } from "@/features/focus/components/PomodoroTimerDisplay";
import { ChecklistModal } from "@/features/focus/components/ChecklistModal";
import { TaskNotesPanel } from "@/features/focus/components/TaskNotesPanel";

export function FlowPomodoro() {
  const { 
    activeTaskId, 
    activePlanTaskId,
    closeFocusMode,
    startTimer,
    pauseTimer,
    pomodoroState,
    accumulatedFocusTime,
    focusMinutes,
    breakMinutes,
    timeLeft,
    currentSession,
    totalSessions,
  } = useFocusStore();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: getTasksAction });
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', todayStr], queryFn: () => getDailyPlanAction(todayStr) });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Task> }) => updateTaskAction(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Patch dailyPlan cache immediately so re-opening this task has fresh actualMinutes
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
    mutationFn: ({ taskId }: { taskId: string }) => toggleTaskDoneAction(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
    },
  });
  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => saveTimeBlocksAction({ dailyPlanId: dailyPlanToday!.id, blocks }),
    onSuccess: (data) => {
      if (dailyPlanToday) {
        queryClient.setQueryData(['dailyPlan', todayStr], { ...dailyPlanToday, timeBlocks: data });
      }
    }
  });
  const { refetch: fetchGoals } = useQuery({ queryKey: ['goals'], queryFn: getGoalsAction, enabled: false });

  const [isFinishing, setIsFinishing] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  useEffect(() => {
    fetchGoals().catch(console.error);
  }, [fetchGoals]);

  const activeTask = tasks.find((t: Task) => t.id === activeTaskId);

  if (!activeTaskId || !activeTask) {
    return <FlowEmptyState />;
  }

  const handleCompleteClick = () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;

    handleComplete();
  };

  const handleComplete = async () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;
    setIsFinishing(true);
    try {
      const actualMinutes = Math.floor(accumulatedFocusTime / 60);
      if (actualMinutes > 0) {
        await updateTaskMutation.mutateAsync({ id: activeTaskId, data: { actualMinutes } });
        if (dailyPlanToday?.timeBlocks && dailyPlanToday.timeBlocks.length > 0) {
          const estimated = activeTask.estimatedMinutes || 0;
          const shifted = shiftTimeBlocks(dailyPlanToday.timeBlocks, activeTaskId, actualMinutes, estimated);
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
      
      const currentTaskIndex = dailyPlanToday?.tasks.findIndex((t: DailyPlanTask) => t.id === activePlanTaskId) ?? -1;
      
      if (dailyPlanToday && currentTaskIndex !== -1) {
        const remainingTasks = dailyPlanToday.tasks.slice(currentTaskIndex + 1).concat(dailyPlanToday.tasks.slice(0, currentTaskIndex));
        const nextTask = remainingTasks.find((t: DailyPlanTask) => t.task.status !== "Done" && t.id !== activePlanTaskId);
        
        if (nextTask) {
          useFocusStore.getState().openFocusMode(nextTask.task.id, nextTask.id, nextTask.task.estimatedMinutes || 25);
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

  const handleStop = () => {
    if (activeTaskId && accumulatedFocusTime > 60) {
      const actualMinutes = Math.round(accumulatedFocusTime / 60);
      updateTaskMutation.mutateAsync({ id: activeTaskId, data: { actualMinutes } }).catch(console.error);
    }
    pauseTimer();
    closeFocusMode();
  };

  return (
    <div className="h-full w-full bg-background flex flex-col relative overflow-hidden items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background pointer-events-none"></div>

      <div className="w-full max-w-lg flex flex-col items-center relative z-10 px-4 h-full max-h-[95vh] py-4">
        <PomodoroTimerDisplay
          activeTask={activeTask}
          pomodoroState={pomodoroState}
          currentSession={currentSession}
          totalSessions={totalSessions}
          timeLeft={timeLeft}
          focusMinutes={focusMinutes}
          breakMinutes={breakMinutes}
        />

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-8 shrink-0">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-xl border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-inner group"
            onClick={handleStop}
          >
            <Square fill="currentColor" strokeWidth={2.5} className="w-4 h-4 group-hover:scale-95 transition-transform" />
          </Button>

          {pomodoroState === "idle" || pomodoroState === "finished" || pomodoroState === "paused" ? (
             <Button 
               size="icon" 
               className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 hover:from-indigo-400 hover:to-violet-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-transform hover:scale-105 active:scale-95 border-none"
               onClick={startTimer}
             >
               <Play fill="currentColor" strokeWidth={2.5} className="w-8 h-8 ml-1" />
             </Button>
          ) : (
            <Button 
               size="icon" 
               className="w-20 h-20 rounded-full bg-card hover:bg-muted text-white shadow-xl transition-transform hover:scale-105 active:scale-95 border border-border"
               onClick={pauseTimer}
             >
               <Pause fill="currentColor" strokeWidth={2.5} className="w-8 h-8 text-foreground" />
             </Button>
          )}

          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-inner group"
            onClick={() => {
              if (activeTask?.checklists && activeTask.checklists.length > 0) {
                const allDone = activeTask.checklists.every((c) => c.isCompleted);
                if (allDone) {
                  handleCompleteClick();
                } else {
                  setIsChecklistModalOpen(true);
                }
              } else {
                handleCompleteClick();
              }
            }}
            disabled={isFinishing}
          >
            {activeTask?.checklists && activeTask.checklists.length > 0 ? (
               <ListTodo strokeWidth={2.5} className="w-5 h-5 group-hover:scale-110 transition-transform" />
            ) : (
               <Check strokeWidth={3} className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground flex flex-col items-center gap-2 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Focused: <span className="text-foreground ml-1">{Math.floor(accumulatedFocusTime / 60)} min</span>
          </div>
          {pomodoroState === "finished" && (
            <div className="text-amber-500 mt-2 text-center max-w-sm bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 font-medium text-xs md:text-sm">
              Time is up! Keep working or mark as complete.
            </div>
          )}
        </div>

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
