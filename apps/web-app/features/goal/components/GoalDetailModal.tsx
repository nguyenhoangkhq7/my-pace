import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Goal } from "../types";
import { Task } from "@/features/board/types";
import { useBoardStore } from "@/features/board/store/board.store";
import { useGoalStore } from "../store/goal.store";
import { Button } from "@/components/ui/button";
import { GoalFormModal } from "./GoalFormModal";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { useGoalStats } from "../hooks/useGoalStats";
import { ProjectDetail } from "./ProjectDetail";
import { HabitDetail } from "./HabitDetail";
import { TargetDetail } from "./TargetDetail";
import { GoalPeriodNavigation } from "./GoalPeriodNavigation";
import { cn } from "@/lib/utils";

interface GoalDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function GoalDetailModal({ isOpen, onOpenChange, goal }: GoalDetailModalProps) {
  const { tasks } = useBoardStore();
  const { goals, updateGoal } = useGoalStore();
  
  const [isSubgoalModalOpen, setIsSubgoalModalOpen] = useState(false);
  const [activeParentGoalId, setActiveParentGoalId] = useState<string | undefined>(undefined);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  const [isEditingProject, setIsEditingProject] = useState(false);

  // Stats Hook
  const {
    timeFilter,
    setTimeFilter,
    referenceDate,
    handlePrev,
    handleNext,
    isFuturePeriod,
    getPeriodLabel,
    goalTasks,
    stats,
  } = useGoalStats(goal, tasks);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setIsEditingProject(false);
    }
  }

  if (!goal) return null;

  const handleOpenCreateSubgoal = (parentId: string) => {
    setActiveParentGoalId(parentId);
    setIsSubgoalModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const subgoals = goals.filter((g) => g.parentGoalId === goal.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-950 border-slate-800 text-slate-100 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/60 shrink-0 relative">
          <div className="flex items-start justify-between pr-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {goal.goalType === "Binary" ? "Project" : goal.goalType === "Time-boxed" ? "Habit" : "Target"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    goal.status === "In Progress"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : goal.status === "Done"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}
                >
                  {goal.status}
                </span>
              </div>
              <DialogTitle className="text-xl">{goal.title}</DialogTitle>
            </div>

            {goal.goalType === "Binary" && (
              <Button
                variant={isEditingProject ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  isEditingProject
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "border-slate-700 text-slate-300 hover:text-white"
                )}
                onClick={() => setIsEditingProject(!isEditingProject)}
              >
                {isEditingProject ? "Xong" : "Chỉnh sửa"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 overflow-y-auto min-h-0 flex-1">
          {goal.goalType !== "Binary" && (
            <GoalPeriodNavigation
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              handlePrev={handlePrev}
              handleNext={handleNext}
              isFuturePeriod={isFuturePeriod()}
              periodLabel={getPeriodLabel()}
            />
          )}
          {goal.goalType === "Binary" && (
            <ProjectDetail
              goal={goal}
              goalTasks={goalTasks}
              subgoals={subgoals}
              isEditingProject={isEditingProject}
              updateGoal={updateGoal}
              handleOpenCreateSubgoal={handleOpenCreateSubgoal}
              onTaskClick={handleTaskClick}
            />
          )}
          {goal.goalType === "Time-boxed" && (
            <HabitDetail
              goal={goal}
              stats={stats}
              timeFilter={timeFilter}
              referenceDate={referenceDate}
              isFuturePeriod={isFuturePeriod}
            />
          )}
          {goal.goalType === "Milestone" && (
            <TargetDetail
              goal={goal}
              stats={stats}
              timeFilter={timeFilter}
              isFuturePeriod={isFuturePeriod}
            />
          )}
        </div>
      </DialogContent>

      <GoalFormModal
        isOpen={isSubgoalModalOpen}
        onOpenChange={setIsSubgoalModalOpen}
        prefilledParentGoalId={activeParentGoalId}
      />

      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          initialData={selectedTask}
        />
      )}
    </Dialog>
  );
}
