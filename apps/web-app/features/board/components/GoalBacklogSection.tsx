import { HugeiconsIcon } from "@hugeicons/react";
import { Target02Icon } from "@hugeicons/core-free-icons";
import { Goal } from "@/features/goal/types";
import { GoalBacklogCard } from "./GoalBacklogCard";

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
        <GoalBacklogCard
          key={goal.id}
          goal={goal}
          isPlanningMode={isPlanningMode}
          onClick={() => onGoalClick(goal)}
        />
      ))}
    </div>
  );
}
