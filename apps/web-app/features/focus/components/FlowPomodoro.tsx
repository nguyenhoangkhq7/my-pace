import { useState } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { usePomodoro } from "@/features/focus/hooks/usePomodoro";
import { useBoardStore } from "@/features/board/store/board.store";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, PauseIcon, StopIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

export function FlowPomodoro() {
  const { 
    activeTaskId, 
    activePlanTaskId,
    closeFocusMode,
    startTimer,
    pauseTimer,
    pomodoroState,
    accumulatedFocusTime,
  } = useFocusStore();

  const { timeLeft, currentSession, totalSessions } = usePomodoro();
  const { tasks, toggleTaskDone, updateTask, dailyPlanToday } = useBoardStore();
  const [isFinishing, setIsFinishing] = useState(false);
  const router = useRouter();

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Empty state if no task is selected
  if (!activeTaskId || !activeTask) {
    const allDone = !!dailyPlanToday?.tasks && dailyPlanToday.tasks.length > 0 && dailyPlanToday.tasks.every(t => t.task.status === "Done");

    if (allDone) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-slate-950 to-slate-950"></div>
          <div className="max-w-md text-center space-y-6 relative z-10">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-5xl shadow-[0_0_50px_rgba(34,197,94,0.15)] border border-green-500/20 text-green-500">
              🎉
            </div>
            <h2 className="text-2xl font-semibold text-slate-100">Kế hoạch hoàn tất!</h2>
            <p className="text-slate-400">
              Bạn đã hoàn thành tất cả công việc cho hôm nay. Tuyệt vời!
            </p>
            <Button onClick={() => router.push('/')} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full mt-4">
              Hoàn tất ngày làm việc
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800/50 text-slate-600">
            ⏳
          </div>
          <h2 className="text-2xl font-semibold text-slate-300">Sẵn sàng tập trung?</h2>
          <p className="text-slate-500">
            Chọn một công việc ở cột bên trái để bắt đầu phiên làm việc sâu (Deep Work).
          </p>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;
    setIsFinishing(true);
    try {
      const actualMinutes = Math.floor(accumulatedFocusTime / 60);
      if (actualMinutes > 0) {
        await updateTask(activeTaskId, { actualMinutes });
      }
      
      const todayStr = new Date().toISOString().split('T')[0];
      await toggleTaskDone(todayStr, activePlanTaskId);
      
      pauseTimer();
      
      // Auto switch to next task
      const { dailyPlanToday } = useBoardStore.getState();
      const currentTaskIndex = dailyPlanToday?.tasks.findIndex(t => t.id === activePlanTaskId) ?? -1;
      
      if (dailyPlanToday && currentTaskIndex !== -1) {
        // Look for the next task that is not Done, starting after the current one
        const remainingTasks = dailyPlanToday.tasks.slice(currentTaskIndex + 1).concat(dailyPlanToday.tasks.slice(0, currentTaskIndex));
        const nextTask = remainingTasks.find(t => t.task.status !== "Done" && t.id !== activePlanTaskId);
        
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calculate SVG Circle
  const radius = 160;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const { focusMinutes, breakMinutes } = useFocusStore.getState();
  const maxTime = pomodoroState === "breaking" ? breakMinutes * 60 : focusMinutes * 60;
  const strokeDashoffset = maxTime > 0 ? circumference - (timeLeft / maxTime) * circumference : 0;

  const getStatusText = () => {
    if (pomodoroState === "idle") return "Ready to Focus";
    if (pomodoroState === "focusing") return "Deep Work";
    if (pomodoroState === "breaking") return "Take a Break";
    if (pomodoroState === "finished") return "Sessions Completed";
    if (pomodoroState === "paused") return "Paused";
    return "";
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col relative overflow-hidden items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="w-full max-w-lg flex flex-col items-center relative z-10 px-4">
        <div className="text-center mb-6">
          <div className="text-slate-400 text-xs md:text-sm mb-2 font-medium uppercase tracking-widest">
            {getStatusText()}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100 px-4 line-clamp-2 leading-snug">
            {activeTask.title}
          </h2>
          <div className="mt-3 inline-flex items-center px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs md:text-sm font-medium">
            Session {currentSession} of {totalSessions}
          </div>
        </div>

        {/* Circular Timer */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 flex items-center justify-center transition-all">
          <svg
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className="transform -rotate-90 drop-shadow-2xl w-full h-full"
          >
            <circle
              stroke="rgba(255,255,255,0.03)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={pomodoroState === "breaking" ? "#10b981" : (pomodoroState === "paused" ? "#f59e0b" : "#6366f1")}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span className={`text-5xl sm:text-6xl font-bold tabular-nums tracking-tighter ${pomodoroState === 'paused' ? 'text-slate-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-6">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-14 h-14 rounded-full border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            onClick={handleStop}
          >
            <HugeiconsIcon icon={StopIcon} size={28} />
          </Button>

          {pomodoroState === "idle" || pomodoroState === "finished" || pomodoroState === "paused" ? (
             <Button 
               size="icon" 
               className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-transform hover:scale-105 active:scale-95"
               onClick={startTimer}
             >
               <HugeiconsIcon icon={PlayIcon} size={40} className="ml-2" />
             </Button>
          ) : (
            <Button 
               size="icon" 
               className="w-20 h-20 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 border border-slate-700"
               onClick={pauseTimer}
             >
               <HugeiconsIcon icon={PauseIcon} size={36} />
             </Button>
          )}

          <Button 
            variant="outline" 
            size="icon" 
            className="w-14 h-14 rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10 hover:border-green-500/50 transition-colors"
            onClick={handleComplete}
            disabled={isFinishing}
          >
            <HugeiconsIcon icon={Tick01Icon} size={28} />
          </Button>
        </div>
        
        <div className="mt-6 text-sm text-slate-500 flex flex-col items-center gap-2">
          <div className="bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800/80 text-xs md:text-sm">
            Actual focused time: <span className="text-slate-300 font-medium">{Math.floor(accumulatedFocusTime / 60)} minutes</span>
          </div>
          {pomodoroState === "finished" && (
            <div className="text-amber-500 mt-3 text-center max-w-sm bg-amber-500/10 px-4 py-3 rounded-xl border border-amber-500/20 font-medium text-xs md:text-sm">
              Time is up! You can keep working, or mark the task as complete when you're ready.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
