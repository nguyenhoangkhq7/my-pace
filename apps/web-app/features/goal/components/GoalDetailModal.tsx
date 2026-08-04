import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Goal, GoalUpdateRequest } from "../types";
import { Task } from "@/features/board/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { useGoalStats } from "../hooks/useGoalStats";
import { ProjectDetail } from "./ProjectDetail";
import { HabitDetail } from "./HabitDetail";
import { GoalPeriodNavigation } from "./GoalPeriodNavigation";
import { useTranslation } from "@/hooks/use-translation";

interface GoalDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function GoalDetailModal({ isOpen, onOpenChange, goal }: GoalDetailModalProps) {
  const { t } = useTranslation();
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => fetchClient.get<Task[]>('tasks').then(r => r.data) });
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: GoalUpdateRequest }) => fetchClient.put(`goals/${id}`, data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
  const updateGoal = (id: string, data: GoalUpdateRequest) => updateMutation.mutateAsync({ id, data });

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

  if (!goal) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "In Progress": return t.goals.inProgress;
      case "Done": return t.goals.done;
      case "Archived": return t.goals.archived;
      default: return t.goals.freeze;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background border-border text-foreground max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60 shrink-0 relative">
          <div className="flex items-start justify-between pr-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border">
                  {goal.goalType === "Binary" ? t.goals.project : t.goals.habit}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    goal.status === "In Progress"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : goal.status === "Done"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-muted/10 text-muted-foreground border-border"
                  }`}
                >
                  {getStatusLabel(goal.status)}
                </span>
              </div>
              <DialogTitle className="text-xl">{goal.title}</DialogTitle>
            </div>
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
              updateGoal={updateGoal}
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

        </div>
      </DialogContent>
    </Dialog>
  );
}
