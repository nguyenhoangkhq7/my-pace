import { Goal } from "../types";
import { GoalCard } from "./GoalCard";

interface GoalDashboardGridProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onCreateTask: (goalId: string) => void;
  onGoalClick: (goal: Goal) => void;
}

export function GoalDashboardGrid({ goals, onEdit, onCreateTask, onGoalClick }: GoalDashboardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {goals.map((goal) => (
        <div key={goal.id} className="cursor-pointer" onClick={() => onGoalClick(goal)}>
          <GoalCard 
            goal={goal} 
            onEdit={onEdit}
            onCreateTask={onCreateTask}
          />
        </div>
      ))}
    </div>
  );
}
