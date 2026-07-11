import { Button } from "@/components/ui/button";
import { Task } from "../types";
import { PlanningTaskItem } from "./PlanningTaskItem";

interface PlanningModeViewProps {
  currentAvailable: number;
  plannedTaskIds: string[];
  tasks: Task[];
  onCancel: () => void;
  onSave: () => void;
  onRemoveTask: (taskId: string) => void;
}

export function PlanningModeView({
  currentAvailable,
  plannedTaskIds,
  tasks,
  onCancel,
  onSave,
  onRemoveTask,
}: PlanningModeViewProps) {
  const plannedTasks = plannedTaskIds
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean) as Task[];

  const mits = plannedTasks.filter(t => t.isImportant);
  const regularTasks = plannedTasks.filter(t => !t.isImportant);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
        <div>
          <div className="text-xs text-primary/80 font-semibold uppercase tracking-wider">Remaining Time</div>
          <div className={`text-2xl font-bold ${currentAvailable < 0 ? 'text-red-500' : 'text-primary'}`}>
            {Math.floor(currentAvailable / 60)}h {currentAvailable % 60}m
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="border-border text-muted-foreground cursor-pointer">
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} className="bg-primary text-white cursor-pointer">
            Save Plan
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {mits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Important Tasks (MITs)</h3>
            {mits.map(task => (
              <PlanningTaskItem key={task.id} task={task} onRemove={onRemoveTask} />
            ))}
          </div>
        )}
        
        {regularTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Tasks</h3>
            {regularTasks.map(task => (
              <PlanningTaskItem key={task.id} task={task} onRemove={onRemoveTask} />
            ))}
          </div>
        )}

        {plannedTasks.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
            <span className="text-sm">Click tasks in the matrix to add them here</span>
          </div>
        )}
      </div>
    </div>
  );
}
