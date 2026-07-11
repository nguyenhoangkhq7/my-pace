import React, { useState } from "react";
import { Goal } from "../types";
import { useGoalStore } from "../store/goal.store";
import { useBoardStore } from "@/features/board/store/board.store";
import { Task } from "@/features/board/types";
import { TaskList } from "./TaskList";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, ArrowDown01Icon, ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface SubgoalAccordionProps {
  subgoal: Goal;
  level: number;
  isEditingProject: boolean;
  handleOpenCreateSubgoal: (parentId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function SubgoalAccordion({
  subgoal,
  level,
  isEditingProject,
  handleOpenCreateSubgoal,
  onTaskClick,
}: SubgoalAccordionProps) {
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";
  const [isOpen, setIsOpen] = useState(false);
  const { goals } = useGoalStore();
  const { tasks } = useBoardStore();

  const childrenSubgoals = goals.filter((g) => g.parentGoalId === subgoal.id);
  const childrenTasks = tasks.filter((t) => t.goalId === subgoal.id);

  return (
    <div className="border border-slate-800/60 rounded-lg bg-slate-900/20 overflow-hidden mb-2">
      <div
        className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon} size={14} className="text-slate-500" />
          <HugeiconsIcon
            icon={Folder01Icon}
            size={14}
            className={subgoal.status === "Done" ? "text-emerald-500" : "text-indigo-400"}
          />
          <span
            className={cn(
              "text-sm font-medium",
              subgoal.status === "Done" ? "text-slate-500 line-through" : "text-slate-200"
            )}
          >
            {subgoal.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">{Math.round(subgoal.progressPct || 0)}%</span>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 border-t border-slate-800/50 bg-slate-950/30 space-y-4 ml-2 border-l-2 border-l-slate-800">
          <TaskList
            taskList={childrenTasks}
            gId={subgoal.id}
            gStatus={subgoal.status}
            isEditingProject={isEditingProject}
            onTaskClick={onTaskClick}
          />

          {level < 3 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.goals.subgoals}</h4>
                {isEditingProject && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-primary hover:text-primary/80 px-2"
                    onClick={() => handleOpenCreateSubgoal(subgoal.id)}
                    disabled={subgoal.status === "Freeze" || subgoal.status === "Archived"}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={12} className="mr-1" />
                    {isVi ? "Mục tiêu con" : "Subgoal"}
                  </Button>
                )}
              </div>
              {childrenSubgoals.length === 0 ? (
                <p className="text-xs text-slate-600 italic">{t.goals.noSubgoals}</p>
              ) : (
                childrenSubgoals.map((child) => (
                  <SubgoalAccordion
                    key={child.id}
                    subgoal={child}
                    level={level + 1}
                    isEditingProject={isEditingProject}
                    handleOpenCreateSubgoal={handleOpenCreateSubgoal}
                    onTaskClick={onTaskClick}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
