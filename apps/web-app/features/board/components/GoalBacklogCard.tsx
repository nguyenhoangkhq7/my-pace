import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Goal } from "@/features/goal/types";
import { cn } from "@/lib/utils";

interface GoalBacklogCardProps {
  goal: Goal;
  isPlanningMode: boolean;
  onClick: () => void;
}

export function GoalBacklogCard({ goal, isPlanningMode, onClick }: GoalBacklogCardProps) {
  const progress = Math.round(goal.progressPct || 0);

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/55 cursor-pointer transition-all flex flex-col gap-2",
        isPlanningMode ? 'hover:shadow-md hover:-translate-y-0.5' : 'opacity-70'
      )}
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
            style={{ width: `${progress}%` }} 
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium w-8 text-right">
          {progress}%
        </span>
      </div>
      
      {isPlanningMode && (
        <div className="text-[10px] text-primary/80 mt-1 flex items-center">
          <HugeiconsIcon icon={PlusSignIcon} size={10} className="mr-1" />
          {goal.goalType === 'Binary' ? 'Bấm để xem chi tiết' : 'Bấm để tạo Task'}
        </div>
      )}
    </div>
  );
}
