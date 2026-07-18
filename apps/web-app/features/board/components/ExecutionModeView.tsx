import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DailyPlan } from "../types";
import type { AvailableTimeData } from "@/features/available-time/types";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthStore } from "@/features/auth";

import { ExecutionStatsSummary } from "./ExecutionStatsSummary";
import { ExecutionTaskList } from "./ExecutionTaskList";

interface ExecutionModeViewProps {
  currentPlan: DailyPlan;
  currentAvailable: number;
  totalAvailable: number;
  availableData: AvailableTimeData | null;
  activeTab: string;
  isStarted: boolean;
  onEditPlan: () => void;
  onStartMyDay: () => void;
  onCancelPlan: () => void;
  onRemoveExcessTasks?: () => void;
}

export function ExecutionModeView({
  currentPlan,
  currentAvailable,
  totalAvailable,
  availableData,
  activeTab,
  isStarted,
  onEditPlan,
  onStartMyDay,
  onCancelPlan,
  onRemoveExcessTasks,
}: ExecutionModeViewProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const tasksList = currentPlan.tasks || [];

  const exceedsSleepTime = useMemo(() => {
    const timeBlocks = currentPlan.timeBlocks || [];
    if (!timeBlocks.length || !user?.sleepTime || !user?.wakeTime) return false;
    
    const endTimes = timeBlocks.map(tb => new Date(tb.endTime).getTime());
    const maxEndTimeMs = Math.max(...endTimes);
    const maxEndDate = new Date(maxEndTimeMs);

    const planDate = new Date(currentPlan.planDate);
    
    const [sh, sm] = user.sleepTime.split(":").map(Number);
    const [wh, wm] = user.wakeTime.split(":").map(Number);
    
    const sleepDate = new Date(planDate);
    sleepDate.setHours(sh, sm, 0, 0);
    
    if (sh < wh || (sh === wh && sm < wm)) {
      sleepDate.setDate(sleepDate.getDate() + 1);
    }
    
    return maxEndDate > sleepDate;
  }, [currentPlan, user]);

  if (tasksList.length === 0) {
    return null;
  }

  // Celebration state
  if (activeTab === 'today' && tasksList.every(t => t.task.status === "Done")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <span className="text-lg">{t.board.allDoneToday}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <ExecutionStatsSummary
        currentAvailable={currentAvailable}
        totalAvailable={totalAvailable}
        availableData={availableData}
        activeTab={activeTab}
        isStarted={isStarted}
        onEditPlan={onEditPlan}
      />

      <ExecutionTaskList currentPlan={currentPlan} />

      {exceedsSleepTime && activeTab === 'today' && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-red-200">Lịch trình vượt quá giờ đi ngủ</h4>
              <p className="text-xs text-red-300/80 leading-relaxed">
                Thời gian kết thúc của các công việc hiện tại đang muộn hơn giờ đi ngủ dự kiến của bạn ({user?.sleepTime}).
              </p>
            </div>
          </div>
          <Button
            onClick={onRemoveExcessTasks}
            variant="outline"
            size="sm"
            className="w-full border-red-500/20 bg-red-950/30 hover:bg-red-900/30 text-red-200 hover:text-white text-xs h-8.5 rounded-lg cursor-pointer"
          >
            Đẩy công việc thừa về Backlog
          </Button>
        </div>
      )}

      <div className="pt-4 border-t border-border flex flex-col gap-2">
        {activeTab === 'today' ? (
          !isStarted ? (
            <>
              <Button
                onClick={onStartMyDay}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer"
              >
                {t.board.startMyDay}
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelPlan} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer">
                {t.board.cancelPlan}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(34,197,94,0.05)] font-semibold text-xs tracking-wider uppercase select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t.board.planConfirmed}
            </div>
          )
        ) : (
          <Button variant="ghost" size="sm" onClick={onCancelPlan} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer">
            {t.board.cancelPlan}
          </Button>
        )}
      </div>
    </div>
  );
}
