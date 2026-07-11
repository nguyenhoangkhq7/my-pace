import { Goal } from "../types";
import { GoalDashboardGrid } from "./GoalDashboardGrid";
import { cn } from "@/lib/utils";

interface GoalStatusGroupProps {
  title: string;
  colorClass: string;
  bulletColorClass: string;
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onCreateTask: (goalId: string) => void;
  onGoalClick: (goal: Goal) => void;
}

export function GoalStatusGroup({
  title,
  colorClass,
  bulletColorClass,
  goals,
  onEdit,
  onCreateTask,
  onGoalClick,
}: GoalStatusGroupProps) {
  if (goals.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className={cn("text-lg font-semibold border-b border-border pb-2 flex items-center gap-2", colorClass)}>
        <span className={cn("w-2.5 h-2.5 rounded-full", bulletColorClass)} />
        {title}
      </h2>
      <GoalDashboardGrid
        goals={goals}
        onEdit={onEdit}
        onCreateTask={onCreateTask}
        onGoalClick={onGoalClick}
      />
    </div>
  );
}
