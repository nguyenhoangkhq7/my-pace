import { useState, useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { useBoardStore } from "@/features/board/store/board.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { Goal } from "@/features/goal/types";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Check, ListTodo } from "lucide-react";

import { FlowEmptyState } from "@/features/focus/components/FlowEmptyState";
import { PomodoroTimerDisplay } from "@/features/focus/components/PomodoroTimerDisplay";
import { ChecklistModal } from "@/features/focus/components/ChecklistModal";
import { QuantityGoalModal } from "@/features/focus/components/QuantityGoalModal";

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
  const { tasks, toggleTaskDone, updateTask } = useBoardStore();
  const { goals, fetchGoals } = useGoalStore();

  const [isFinishing, setIsFinishing] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [quantityGoal, setQuantityGoal] = useState<Goal | null>(null);
  const [addedCount, setAddedCount] = useState<string>("1");

  useEffect(() => {
    fetchGoals().catch(console.error);
  }, [fetchGoals]);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  if (!activeTaskId || !activeTask) {
    return <FlowEmptyState />;
  }

  const handleCompleteClick = () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;

    const associatedGoal = goals.find((g) => g.id === activeTask?.goalId);
    if (associatedGoal && associatedGoal.goalType === "Milestone") {
      setQuantityGoal(associatedGoal);
      setAddedCount("1");
      setIsQuantityDialogOpen(true);
    } else {
      handleComplete(1);
    }
  };

  const handleComplete = async (countVal: number = 1) => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;
    setIsFinishing(true);
    try {
      const actualMinutes = Math.floor(accumulatedFocusTime / 60);
      if (actualMinutes > 0) {
        await updateTask(activeTaskId, { actualMinutes });
      } else {
        useFocusStore.getState().setPromptTask({
          id: activeTaskId,
          title: activeTask.title,
          estimatedMinutes: activeTask.estimatedMinutes || 0
        });
      }
      
      const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      await toggleTaskDone(todayStr, activePlanTaskId, countVal);
      
      pauseTimer();
      setIsQuantityDialogOpen(false);
      setQuantityGoal(null);
      
      const { dailyPlanToday } = useBoardStore.getState();
      const currentTaskIndex = dailyPlanToday?.tasks.findIndex((t) => t.id === activePlanTaskId) ?? -1;
      
      if (dailyPlanToday && currentTaskIndex !== -1) {
        const remainingTasks = dailyPlanToday.tasks.slice(currentTaskIndex + 1).concat(dailyPlanToday.tasks.slice(0, currentTaskIndex));
        const nextTask = remainingTasks.find((t) => t.task.status !== "Done" && t.id !== activePlanTaskId);
        
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
      updateTask(activeTaskId, { actualMinutes }).catch(console.error);
    }
    pauseTimer();
    closeFocusMode();
  };

  return (
    <div className="h-full w-full bg-background flex flex-col relative overflow-hidden items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background pointer-events-none"></div>

      <div className="w-full max-w-lg flex flex-col items-center relative z-10 px-4 h-full max-h-[90vh] py-8">
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
        <div className="mt-12 flex items-center justify-center gap-8 shrink-0">
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
        
        <div className="mt-8 text-sm text-muted-foreground flex flex-col items-center gap-2 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Focused: <span className="text-foreground ml-1">{Math.floor(accumulatedFocusTime / 60)} min</span>
          </div>
          {pomodoroState === "finished" && (
            <div className="text-amber-500 mt-2 text-center max-w-sm bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 font-medium text-xs md:text-sm">
              Time is up! Keep working or mark as complete.
            </div>
          )}
        </div>

        <ChecklistModal
          isOpen={isChecklistModalOpen}
          onOpenChange={setIsChecklistModalOpen}
          activeTask={activeTask}
          onAllCompleted={handleCompleteClick}
        />

        <QuantityGoalModal
          isOpen={isQuantityDialogOpen}
          onOpenChange={setIsQuantityDialogOpen}
          quantityGoal={quantityGoal}
          addedCount={addedCount}
          setAddedCount={setAddedCount}
          onConfirm={handleComplete}
          isFinishing={isFinishing}
        />
      </div>
    </div>
  );
}
