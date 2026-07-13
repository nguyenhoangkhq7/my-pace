import { Button } from "@/components/ui/button";
import { DailyPlan } from "../types";
import type { AvailableTimeData } from "@/features/available-time/types";
import { useTranslation } from "@/hooks/use-translation";

import { ExecutionStatsSummary } from "./ExecutionStatsSummary";
import { ExecutionTaskList } from "./ExecutionTaskList";

interface ExecutionModeViewProps {
  currentPlan: DailyPlan;
  currentAvailable: number;
  availableData: AvailableTimeData | null;
  activeTab: string;
  isStarted: boolean;
  onEditPlan: () => void;
  onStartMyDay: () => void;
  onCancelPlan: () => void;
}

export function ExecutionModeView({
  currentPlan,
  currentAvailable,
  availableData,
  activeTab,
  isStarted,
  onEditPlan,
  onStartMyDay,
  onCancelPlan,
}: ExecutionModeViewProps) {
  const { t } = useTranslation();
  const tasksList = currentPlan.tasks || [];

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
        availableData={availableData}
        activeTab={activeTab}
        isStarted={isStarted}
        onEditPlan={onEditPlan}
      />

      <ExecutionTaskList currentPlan={currentPlan} />

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
            <div className="text-center text-xs text-green-500/90 font-medium py-2 bg-green-500/5 rounded-xl border border-green-500/10">
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
