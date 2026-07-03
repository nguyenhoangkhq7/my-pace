import { useState, useEffect } from "react";
import { useFocusStore } from "@/features/focus/store/focus.store";
import { usePomodoro } from "@/features/focus/hooks/usePomodoro";
import { useBoardStore } from "@/features/board/store/board.store";
import { useGoalStore } from "@/features/goal/store/goal.store";
import { Goal } from "@/features/goal/types";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Check, ListTodo, Settings2, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PomodoroSettingsModal() {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    focusMinutes, 
    breakMinutes, 
    soundEnabled, 
    updateConfig 
  } = useFocusStore();

  const [tempFocus, setTempFocus] = useState(focusMinutes.toString());
  const [tempBreak, setTempBreak] = useState(breakMinutes.toString());
  const [tempSound, setTempSound] = useState(soundEnabled);

  useEffect(() => {
    if (isSettingsOpen) {
      setTempFocus(focusMinutes.toString());
      setTempBreak(breakMinutes.toString());
      setTempSound(soundEnabled);
    }
  }, [isSettingsOpen, focusMinutes, breakMinutes, soundEnabled]);

  const handleSaveSettings = () => {
    const f = parseInt(tempFocus, 10);
    const b = parseInt(tempBreak, 10);
    if (!isNaN(f) && !isNaN(b) && f > 0 && b > 0) {
      updateConfig(f, b, tempSound);
      setIsSettingsOpen(false);
    }
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="sm:max-w-xs bg-[#0f172a] border-[#1e293b] text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> Cấu hình Pomodoro
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Tùy chỉnh thời gian tập trung và nghỉ ngơi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thời gian tập trung (phút)</label>
            <Input 
              type="number" 
              min="1"
              max="120"
              value={tempFocus}
              onChange={(e) => setTempFocus(e.target.value)}
              className="bg-[#0a0f1e] border-[#1e293b] text-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thời gian nghỉ (phút)</label>
            <Input 
              type="number" 
              min="1"
              max="60"
              value={tempBreak}
              onChange={(e) => setTempBreak(e.target.value)}
              className="bg-[#0a0f1e] border-[#1e293b] text-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              {tempSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Âm thanh thông báo
            </label>
            <Checkbox 
              checked={tempSound}
              onCheckedChange={(checked) => setTempSound(!!checked)}
              className="border-slate-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-[#1e293b] hover:bg-[#131c31] text-slate-300" onClick={() => setIsSettingsOpen(false)}>
            Hủy
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleSaveSettings}>
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function FlowPomodoro() {
  const { 
    activeTaskId, 
    activePlanTaskId,
    closeFocusMode,
    startTimer,
    pauseTimer,
    pomodoroState,
    accumulatedFocusTime,
    isSettingsOpen,
    setIsSettingsOpen,
    focusMinutes,
    breakMinutes,
  } = useFocusStore();

  const { timeLeft, currentSession, totalSessions } = usePomodoro();
  const { tasks, toggleTaskDone, updateTask, dailyPlanToday, reviewDailyPlan } = useBoardStore();
  const { goals, fetchGoals } = useGoalStore();

  const [isFinishing, setIsFinishing] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [quantityGoal, setQuantityGoal] = useState<Goal | null>(null);
  const [addedCount, setAddedCount] = useState<string>("1");

  useEffect(() => {
    fetchGoals().catch(console.error);
  }, [fetchGoals]);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Empty state if no task is selected
  if (!activeTaskId || !activeTask) {
    const allDone = !!dailyPlanToday?.tasks && dailyPlanToday.tasks.length > 0 && dailyPlanToday.tasks.every(t => t.task.status === "Done");

    if (allDone) {
      const totalMinutes = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.actualMinutes || 0), 0);
      const totalEstimated = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.estimatedMinutes || 0), 0);
      const completedCount = dailyPlanToday.tasks.length;
      const isReviewed = dailyPlanToday?.isReviewed || false;

      return (
        <div className="h-full flex flex-col items-center justify-center bg-[#0a0f1e] p-6 relative w-full">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0a0f1e] to-[#0a0f1e] pointer-events-none"></div>
          <div className="max-w-md text-center space-y-6 relative z-10">
            {isReviewed ? (
              <>
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-5xl shadow-[0_0_40px_rgba(16,185,129,0.15)] border border-emerald-500/20 text-emerald-400">
                  🎉
                </div>
                <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Tuyệt vời!</h2>
                <p className="text-slate-400 font-medium">
                  Bạn đã hoàn thành tất cả công việc cho hôm nay. Tuyệt vời!
                </p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-5xl shadow-[0_0_40px_rgba(99,102,241,0.15)] border border-indigo-500/20 text-indigo-400">
                  📊
                </div>
                <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Kế hoạch hoàn tất!</h2>
                <p className="text-slate-400 font-medium">
                  Hãy nhìn lại những gì bạn đã đạt được trong ngày hôm nay.
                </p>
                <Button onClick={() => setIsReviewModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-full mt-4 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  End-of-Day Review
                </Button>
              </>
            )}
          </div>

          <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
            <DialogContent className="sm:max-w-[500px] bg-[#0f172a] text-slate-50 border-[#1e293b] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-center font-bold tracking-wide">Tổng kết cuối ngày 🌟</DialogTitle>
                <DialogDescription className="text-center pt-2 text-slate-400 font-medium">
                  Dưới đây là những gì bạn đã làm được hôm nay:
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="bg-[#0a0f1e] border border-[#1e293b] rounded-2xl p-5 text-center">
                  <div className="text-5xl font-black text-indigo-400 mb-2 drop-shadow-md">{completedCount}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tasks Done</div>
                </div>
                <div className="bg-[#0a0f1e] border border-[#1e293b] rounded-2xl p-5 text-center">
                  <div className="text-5xl font-black text-emerald-400 mb-2 drop-shadow-md">{totalMinutes}</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Focus Minutes</div>
                </div>
                <div className="bg-[#0a0f1e] border border-[#1e293b] rounded-2xl p-5 text-center col-span-2">
                  <div className="text-3xl font-bold text-cyan-400 mb-2 drop-shadow-sm">{totalEstimated}m</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Estimated Time Originally</div>
                </div>
              </div>

              <div className="text-center text-sm text-slate-500 font-medium italic pb-4 px-4">
                "Thành công không phải là đích đến, mà là chặng đường bạn đã nỗ lực mỗi ngày."
              </div>

              <DialogFooter className="flex justify-center sm:justify-center border-t border-[#1e293b] pt-5">
                <Button 
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    if (dailyPlanToday) {
                      reviewDailyPlan(dailyPlanToday.planDate);
                    }
                  }} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white w-full rounded-full font-bold shadow-lg h-12"
                >
                  Tuyệt vời, Đóng lại
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0f1e] p-6 relative w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#131c31] via-[#0a0f1e] to-[#0a0f1e] pointer-events-none"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          <div className="w-24 h-24 bg-[#0f172a] rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-[#1e293b] text-slate-600">
            ⏳
          </div>
          <h2 className="text-2xl font-bold text-slate-200 tracking-wide">Sẵn sàng tập trung?</h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
            Chọn một công việc ở cột bên trái để bắt đầu phiên làm việc sâu (Deep Work).
          </p>
        </div>
      </div>
    );
  }

  const handleCompleteClick = () => {
    if (!activeTaskId || !activePlanTaskId || isFinishing) return;

    const associatedGoal = goals.find(g => g.id === activeTask?.goalId);
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
      }
      
      const todayStr = new Date().toISOString().split('T')[0];
      await toggleTaskDone(todayStr, activePlanTaskId, countVal);
      
      pauseTimer();
      setIsQuantityDialogOpen(false);
      setQuantityGoal(null);
      
      const { dailyPlanToday } = useBoardStore.getState();
      const currentTaskIndex = dailyPlanToday?.tasks.findIndex(t => t.id === activePlanTaskId) ?? -1;
      
      if (dailyPlanToday && currentTaskIndex !== -1) {
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

  // Timer Math
  const radius = 140;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const maxTime = pomodoroState === "breaking" ? breakMinutes * 60 : focusMinutes * 60;
  const strokeDashoffset = maxTime > 0 ? circumference - (timeLeft / maxTime) * circumference : 0;

  const renderStatusBadge = () => {
    if (pomodoroState === "idle") return { text: "READY TO FOCUS", color: "text-slate-400", dot: "bg-slate-400" };
    if (pomodoroState === "focusing") return { text: "DEEP WORK", color: "text-cyan-400", dot: "bg-cyan-400 animate-pulse" };
    if (pomodoroState === "breaking") return { text: "TAKE A BREAK", color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" };
    if (pomodoroState === "finished") return { text: "SESSIONS COMPLETED", color: "text-indigo-400", dot: "bg-indigo-400" };
    if (pomodoroState === "paused") return { text: "PAUSED", color: "text-amber-400", dot: "bg-amber-400" };
    return { text: "", color: "", dot: "" };
  };
  const status = renderStatusBadge();

  return (
    <div className="h-full w-full bg-[#0a0f1e] flex flex-col relative overflow-hidden items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0a0f1e] to-[#0a0f1e] pointer-events-none"></div>

      <div className="w-full max-w-lg flex flex-col items-center relative z-10 px-4 h-full max-h-[90vh] py-8">
        
        {/* Top: Status Badge, Title */}
        <div className="text-center mb-10 shrink-0 space-y-4 relative w-full flex flex-col items-center">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0f172a] border border-[#1e293b] ${status.color} text-[10px] font-bold uppercase tracking-widest`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
            <span>{status.text}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 px-4 line-clamp-2 leading-tight tracking-tight max-w-[400px]">
            {activeTask.title}
          </h2>
          <div className="flex items-center justify-center space-x-1.5 mt-2">
            {Array.from({ length: totalSessions }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-500",
                  i < currentSession - 1 ? "bg-indigo-500" : i === currentSession - 1 && pomodoroState !== 'idle' ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-[#1e293b]"
                )}
              />
            ))}
          </div>
        </div>

        {/* Middle: Circular Timer */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-center transition-all shrink-0">
          <svg
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className="absolute inset-0 transform -rotate-90 w-full h-full drop-shadow-[0_0_30px_rgba(99,102,241,0.15)]"
          >
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={pomodoroState === "breaking" ? "#10b981" : "#8b5cf6"} />
                <stop offset="100%" stopColor={pomodoroState === "breaking" ? "#34d399" : "#06b6d4"} />
              </linearGradient>
            </defs>
            <circle
              stroke="#1e293b"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={pomodoroState === "paused" ? "#f59e0b" : "url(#timerGradient)"}
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
          
          <div className="relative flex flex-col items-center justify-center z-10">
            <span className={cn(
              "text-6xl sm:text-7xl font-light tabular-nums tracking-tighter transition-colors duration-300", 
              pomodoroState === 'paused' ? 'text-slate-500' : 'text-white'
            )}>
              {formatTime(timeLeft)}
            </span>
            
            {pomodoroState === "focusing" && (
              <div className="flex items-end justify-center space-x-1 h-4 mt-2 opacity-80">
                <div className="w-1 h-3 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                <div className="w-1 h-full bg-indigo-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]"></div>
                <div className="w-1 h-3 bg-cyan-400 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Controls */}
        <div className="mt-12 flex items-center justify-center gap-8 shrink-0">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-xl border-[#1e293b] bg-[#0f172a] text-slate-500 hover:text-slate-300 hover:bg-[#131c31] hover:border-slate-700 transition-all shadow-inner group"
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
               className="w-20 h-20 rounded-full bg-[#0f172a] hover:bg-[#131c31] text-white shadow-xl transition-transform hover:scale-105 active:scale-95 border border-[#1e293b]"
               onClick={pauseTimer}
             >
               <Pause fill="currentColor" strokeWidth={2.5} className="w-8 h-8" />
             </Button>
          )}

          <Button 
            variant="outline" 
            size="icon" 
            className="w-12 h-12 rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-inner group"
            onClick={() => {
              if (activeTask?.checklists && activeTask.checklists.length > 0) {
                const allDone = activeTask.checklists.every(c => c.isCompleted);
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
        
        <div className="mt-8 text-sm text-slate-500 flex flex-col items-center gap-2 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Focused: <span className="text-slate-300 ml-1">{Math.floor(accumulatedFocusTime / 60)} min</span>
          </div>
          {pomodoroState === "finished" && (
            <div className="text-amber-400 mt-2 text-center max-w-sm bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 font-medium text-xs md:text-sm">
              Time is up! Keep working or mark as complete.
            </div>
          )}
        </div>

        {activeTask?.checklists && activeTask.checklists.length > 0 && (
          <Dialog open={isChecklistModalOpen} onOpenChange={setIsChecklistModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-[#0f172a] text-slate-50 border-[#1e293b]">
              <DialogHeader>
                <DialogTitle className="font-bold tracking-wide">Hoàn thành Checklist</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  Hãy hoàn thành tất cả các bước trước khi đóng công việc này.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {activeTask.checklists.map(item => (
                  <div key={item.id} className="flex items-start gap-3 bg-[#0a0f1e] p-3 rounded-xl border border-[#1e293b] hover:border-slate-700 transition-colors">
                    <Checkbox 
                      checked={item.isCompleted} 
                      onCheckedChange={(checked) => {
                         useBoardStore.getState().updateChecklistItem(activeTask.id, item.id, { isCompleted: checked === true });
                         
                         const allDone = (activeTask.checklists || []).every(c => 
                           c.id === item.id ? checked === true : c.isCompleted
                         );
                         if (allDone) {
                           setTimeout(() => {
                             setIsChecklistModalOpen(false);
                             handleCompleteClick();
                           }, 400);
                         }
                      }}
                      className="mt-0.5 border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className={cn("text-sm pt-0.5 leading-tight flex-1 font-medium", item.isCompleted ? "line-through text-slate-500" : "text-slate-200")}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isQuantityDialogOpen} onOpenChange={setIsQuantityDialogOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#0f172a] text-slate-100 border-[#1e293b]">
            <DialogHeader>
              <DialogTitle className="font-bold tracking-wide">Cập nhật số lượng mục tiêu</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">
                Nhập số lượng hoàn thành cho: <span className="text-indigo-400 font-semibold">{quantityGoal?.title}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Số lượng</label>
              <Input
                type="number"
                min="1"
                value={addedCount}
                onChange={e => setAddedCount(e.target.value)}
                className="bg-[#0a0f1e] border-[#1e293b] text-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <DialogFooter className="flex justify-end gap-2 border-t border-[#1e293b] pt-4">
              <Button variant="outline" className="border-[#1e293b] hover:bg-[#131c31] text-slate-300" onClick={() => setIsQuantityDialogOpen(false)} disabled={isFinishing}>
                Hủy
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold" onClick={() => handleComplete(Number(addedCount) || 1)} disabled={isFinishing}>
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
