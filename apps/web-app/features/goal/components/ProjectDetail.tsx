import React from "react";
import { Goal } from "../types";
import { Task } from "@/features/board/types";
import { TaskList } from "./TaskList";
import { SubgoalAccordion } from "./SubgoalAccordion";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface ProjectDetailProps {
  goal: Goal;
  goalTasks: Task[];
  subgoals: Goal[];
  isEditingProject: boolean;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<unknown>;
  handleOpenCreateSubgoal: (parentId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function ProjectDetail({
  goal,
  goalTasks,
  subgoals,
  isEditingProject,
  updateGoal,
  handleOpenCreateSubgoal,
  onTaskClick,
}: ProjectDetailProps) {
  const totalItems = goalTasks.length + subgoals.length;
  const doneTasks = goalTasks.filter((t) => t.status === "Done").length;
  const doneSubgoals = subgoals.filter((g) => g.status === "Done").length;
  const doneItems = doneTasks + doneSubgoals;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const handleMarkAsDone = async () => {
    try {
      await updateGoal(goal.id, { status: "Done" });
      toast.success("Congratulations! Project completed!");
    } catch {
      toast.error("Lỗi khi hoàn thành Project.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
            Project Progress
          </h3>
          <div className="text-2xl font-bold text-slate-100">
            {doneItems} / {totalItems} <span className="text-sm font-normal text-slate-500">Mục</span>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">
            Hoàn thành
          </h3>
          <div className="text-2xl font-bold text-primary">{pct}%</div>
        </div>
      </div>

      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden -mt-2">
        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {pct === 100 && goal.status !== "Done" && (
        <div className="flex justify-center mt-2 mb-4">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white w-full" onClick={handleMarkAsDone}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="mr-2" />
            Mark Project as Done
          </Button>
        </div>
      )}

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
        <TaskList
          taskList={goalTasks}
          gId={goal.id}
          gStatus={goal.status}
          isEditingProject={isEditingProject}
          onTaskClick={onTaskClick}
        />

        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-2">
            <h3 className="text-sm font-semibold text-slate-200">Subgoals</h3>
            {isEditingProject && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-primary hover:text-primary/80"
                onClick={() => handleOpenCreateSubgoal(goal.id)}
                disabled={goal.status === "Freeze" || goal.status === "Archived"}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} className="mr-1" />
                + Subgoal
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {subgoals.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No subgoals yet.</p>
            ) : (
              subgoals.map((g) => (
                <SubgoalAccordion
                  key={g.id}
                  subgoal={g}
                  level={2}
                  isEditingProject={isEditingProject}
                  handleOpenCreateSubgoal={handleOpenCreateSubgoal}
                  onTaskClick={onTaskClick}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
