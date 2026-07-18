import { Task } from "../types";
import { TaskBacklogCard } from "./TaskBacklogCard";

interface EisenhowerQuadrantProps {
  title: string;
  isUrgent: boolean;
  isImportant: boolean;
  colorClass: string;
  tasks: Task[];
  plannedTaskIds: string[];
  isPlanningMode: boolean;
  selectedFilterId: string | null;
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, isUrgent: boolean, isImportant: boolean) => void;
}

export function EisenhowerQuadrant({
  title,
  isUrgent,
  isImportant,
  colorClass,
  tasks,
  plannedTaskIds,
  isPlanningMode,
  selectedFilterId,
  onTaskClick,
  onTaskDrop,
}: EisenhowerQuadrantProps) {
  
  let qTasks = tasks.filter(t => 
    t.status === "Backlog" && 
    t.isUrgent === isUrgent && 
    t.isImportant === isImportant &&
    !(isPlanningMode && plannedTaskIds.includes(t.id))
  );
  
  if (selectedFilterId === "goal") {
    qTasks = qTasks.filter(t => !!t.goalId);
  } else if (selectedFilterId && selectedFilterId !== "none") {
    qTasks = qTasks.filter(t => t.categoryId === selectedFilterId);
  }

  qTasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const isQ3 = isUrgent && !isImportant;
  const isQ4 = !isUrgent && !isImportant;
  const opacityClass = isQ3 
    ? "opacity-70 hover:opacity-100 transition-all duration-300" 
    : isQ4 
      ? "opacity-40 hover:opacity-100 transition-all duration-300" 
      : "";

  return (
    <div 
      className={`flex flex-col border border-border rounded-xl overflow-hidden bg-muted/20 transition-all duration-300 ${opacityClass}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("bg-muted/40", "border-primary/50");
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("bg-muted/40", "border-primary/50");
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("bg-muted/40", "border-primary/50");
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
          onTaskDrop(taskId, isUrgent, isImportant);
        }
      }}
    >
      <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${colorClass} border-b border-border/40 bg-muted/40`}>
        {title} <span className="text-muted-foreground ml-1">({qTasks.length})</span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[150px] scrollbar-thin">
        {qTasks.map(task => (
          <TaskBacklogCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            isPlanned={isPlanningMode && plannedTaskIds.includes(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
