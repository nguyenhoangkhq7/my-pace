import { DailyPlan } from "../types";
import { ExecutionTaskItem } from "./ExecutionTaskItem";
import { useTranslation } from "@/hooks/use-translation";

interface ExecutionTaskListProps {
  currentPlan: DailyPlan;
}

export function ExecutionTaskList({ currentPlan }: ExecutionTaskListProps) {
  const { t } = useTranslation();
  const tasksList = currentPlan.tasks || [];
  const mits = tasksList.filter(t => t.isMit);
  const regular = tasksList.filter(t => !t.isMit);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
      {mits.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.planning.mits}</h3>
          {mits.map(pt => (
            <ExecutionTaskItem
              key={pt.id}
              task={pt.task}
              isMit={pt.isMit}
              isConfirmed={currentPlan.isConfirmed}
            />
          ))}
        </div>
      )}
      
      {regular.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.planning.otherTasks}</h3>
          {regular.map(pt => (
            <ExecutionTaskItem
              key={pt.id}
              task={pt.task}
              isMit={pt.isMit}
              isConfirmed={currentPlan.isConfirmed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
