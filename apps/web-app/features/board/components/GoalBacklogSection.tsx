import { HugeiconsIcon } from "@hugeicons/react";
import { Target02Icon, Folder01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Goal } from "@/features/goal/types";

interface GoalBacklogSectionProps {
  goals: Goal[];
  isPlanningMode: boolean;
  onGoalClick: (goal: Goal) => void;
}

export function GoalBacklogSection({
  goals,
  isPlanningMode,
  onGoalClick,
}: GoalBacklogSectionProps) {
  const activeGoals = goals.filter(g => g.status === 'In Progress' && !g.parentGoalId);

  if (activeGoals.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted/20">
        <HugeiconsIcon icon={Target02Icon} size={32} className="mb-2 opacity-50" />
        <p>Không có Goal nào đang thực thi (In Progress).</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 p-1 scrollbar-thin">
      {activeGoals.map(goal => (
        <div 
          key={goal.id}
          onClick={() => onGoalClick(goal)}
          className={`p-4 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/55 cursor-pointer transition-all flex flex-col gap-2 ${
            isPlanningMode ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-70'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">{goal.title}</h4>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {goal.goalType === 'Binary' && <HugeiconsIcon icon={Folder01Icon} size={10} className="inline mr-1" />}
                {goal.goalType === 'Binary' ? 'Dự án' : goal.goalType === 'Time-boxed' ? 'Thói quen' : 'Mục tiêu'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${Math.round(goal.progressPct || 0)}%` }} 
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium w-8 text-right">
              {Math.round(goal.progressPct || 0)}%
            </span>
          </div>
          
          {isPlanningMode && (
            <div className="text-[10px] text-primary/80 mt-1 flex items-center">
              <HugeiconsIcon icon={PlusSignIcon} size={10} className="mr-1" />
              {goal.goalType === 'Binary' ? 'Bấm để xem chi tiết' : 'Bấm để tạo Task'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
