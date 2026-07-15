"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGoalsAction } from "../actions/goal.action";
import { GoalFormModal } from "./GoalFormModal";
import { GoalRulesModal } from "./GoalRulesModal";
import { Goal } from "../types";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { toast } from "sonner";
import { getCategoriesAction } from "@/features/board/actions/category.action";
import { getTasksAction } from "@/features/board/actions/task.action";
import { GoalDetailModal } from "./GoalDetailModal";

// Sub-components
import { GoalDashboardHeader } from "./GoalDashboardHeader";
import { GoalDashboardFilters } from "./GoalDashboardFilters";
import { GoalDashboardGrid } from "./GoalDashboardGrid";
import { GoalStatusGroup } from "./GoalStatusGroup";
import { GoalEmptyState } from "./GoalEmptyState";

export function GoalDashboard({ initialGoals = [] }: { initialGoals?: Goal[] }) {
  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: () => getGoalsAction(),
    initialData: initialGoals,
  });
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("In Progress");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // For Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [prefilledGoalId, setPrefilledGoalId] = useState<string | undefined>(undefined);

  useQuery({ queryKey: ['categories'], queryFn: getCategoriesAction });
  useQuery({ queryKey: ['tasks'], queryFn: getTasksAction });

  // Handle errors from backend e.g. Limit Exceeded
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const filteredGoals = goals.filter((g) => {
    if (filterType !== "ALL" && g.goalType !== filterType) return false;
    if (filterStatus !== "ALL" && g.status !== filterStatus) return false;
    return true;
  });

  const handleCreateNew = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleCreateTaskFromGoal = (goalId: string) => {
    setPrefilledGoalId(goalId);
    setIsTaskModalOpen(true);
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <GoalDashboardHeader
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenCreate={handleCreateNew}
      />

      <GoalDashboardFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterType={filterType}
        setFilterType={setFilterType}
      />

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {isLoading && goals.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredGoals.length > 0 ? (
          filterStatus !== "ALL" ? (
            <GoalDashboardGrid
              goals={filteredGoals}
              onEdit={handleEdit}
              onCreateTask={handleCreateTaskFromGoal}
              onGoalClick={handleGoalClick}
            />
          ) : (
            <div className="space-y-8">
              <GoalStatusGroup
                title="In Progress"
                colorClass="text-primary"
                bulletColorClass="bg-primary"
                goals={filteredGoals.filter(g => g.status === "In Progress")}
                onEdit={handleEdit}
                onCreateTask={handleCreateTaskFromGoal}
                onGoalClick={handleGoalClick}
              />
              <GoalStatusGroup
                title="Freeze"
                colorClass="text-orange-400"
                bulletColorClass="bg-orange-400"
                goals={filteredGoals.filter(g => g.status === "Freeze")}
                onEdit={handleEdit}
                onCreateTask={handleCreateTaskFromGoal}
                onGoalClick={handleGoalClick}
              />
              <GoalStatusGroup
                title="Done"
                colorClass="text-green-400"
                bulletColorClass="bg-green-400"
                goals={filteredGoals.filter(g => g.status === "Done")}
                onEdit={handleEdit}
                onCreateTask={handleCreateTaskFromGoal}
                onGoalClick={handleGoalClick}
              />
              <GoalStatusGroup
                title="Archived"
                colorClass="text-muted-foreground"
                bulletColorClass="bg-muted-foreground"
                goals={filteredGoals.filter(g => g.status === "Archived")}
                onEdit={handleEdit}
                onCreateTask={handleCreateTaskFromGoal}
                onGoalClick={handleGoalClick}
              />
            </div>
          )
        ) : (
          <GoalEmptyState />
        )}
      </div>

      <GoalDetailModal 
        isOpen={isDetailModalOpen} 
        onOpenChange={setIsDetailModalOpen} 
        goal={selectedGoal} 
      />

      <GoalFormModal 
        isOpen={isGoalModalOpen} 
        onOpenChange={setIsGoalModalOpen} 
        goal={selectedGoal} 
        onSuccess={(g) => {
          setFilterStatus(g.status);
          toast.success(`Goal created/updated successfully! Switch to ${g.status} tab.`);
        }}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onOpenChange={(open) => {
          setIsTaskModalOpen(open);
          if (!open) setPrefilledGoalId(undefined);
        }}
        prefilledGoalId={prefilledGoalId}
        isUrgent={false}
        isImportant={true}
      />

      <GoalRulesModal
        isOpen={isRulesModalOpen}
        onOpenChange={setIsRulesModalOpen}
      />
    </div>
  );
}

