"use client";

import { useEffect, useState } from "react";
import { useGoalStore } from "../store/goal.store";
import { GoalCard } from "./GoalCard";
import { GoalFormModal } from "./GoalFormModal";
import { GoalRulesModal } from "./GoalRulesModal";
import { Goal } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Target02Icon, PlusSignIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";

import { useBoardStore } from "@/features/board/store/board.store";
import { GoalDetailModal } from "./GoalDetailModal";

export function GoalDashboard() {
  const { goals, fetchGoals, isLoading, updateGoal, error } = useGoalStore();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("In Progress");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // For Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [prefilledGoalId, setPrefilledGoalId] = useState<string | undefined>(undefined);

  const { fetchCategories } = useBoardStore();

  useEffect(() => {
    fetchGoals();
    fetchCategories();
  }, [fetchGoals, fetchCategories]);

  // Handle errors from backend e.g. Limit Exceeded
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const filteredGoals = goals.filter((g) => {
    if (g.parentGoalId) return false;
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

  const handleStatusChange = async (goal: Goal, newStatus: string) => {
    try {
      await updateGoal(goal.id, { status: newStatus as any });
      toast.success(`Status updated to ${newStatus}`);
    } catch (e: any) {
      // Error is handled by store + useEffect
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <HugeiconsIcon icon={Target02Icon} className="text-primary" size={26} />
            Mục Tiêu
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">Quản lý các mục tiêu dài hạn và theo dõi tiến độ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsRulesModalOpen(true)} className="text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mr-2" />
            Hướng dẫn
          </Button>
          <Button onClick={handleCreateNew} size="lg" className="shadow-lg hover:shadow-primary/25 transition-all">
            <HugeiconsIcon icon={PlusSignIcon} size={18} className="mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-fit">
          <TabsList className="bg-muted border border-border text-muted-foreground h-9 p-1">
            <TabsTrigger value="ALL" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
            <TabsTrigger value="In Progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">In Progress</TabsTrigger>
            <TabsTrigger value="Freeze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Freeze</TabsTrigger>
            <TabsTrigger value="Done" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Done</TabsTrigger>
            <TabsTrigger value="Archived" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
            <SelectValue placeholder="Loại Goal" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="Binary">Project</SelectItem>
            <SelectItem value="Time-boxed">Habit</SelectItem>
            <SelectItem value="Milestone">Target</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {isLoading && goals.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredGoals.length > 0 ? (
          filterStatus !== "ALL" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGoals.map((goal) => (
                <div key={goal.id} className="cursor-pointer" onClick={() => handleGoalClick(goal)}>
                  <GoalCard 
                    goal={goal} 
                    onEdit={handleEdit}
                    onStatusChange={handleStatusChange}
                    onCreateTask={handleCreateTaskFromGoal}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Group: In Progress */}
              {filteredGoals.some(g => g.status === "In Progress") && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-primary border-b border-border pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    In Progress
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGoals.filter(g => g.status === "In Progress").map((goal) => (
                      <div key={goal.id} className="cursor-pointer" onClick={() => handleGoalClick(goal)}>
                        <GoalCard 
                          goal={goal} 
                          onEdit={handleEdit}
                          onStatusChange={handleStatusChange}
                          onCreateTask={handleCreateTaskFromGoal}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Freeze */}
              {filteredGoals.some(g => g.status === "Freeze") && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-orange-400 border-b border-border pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    Freeze
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGoals.filter(g => g.status === "Freeze").map((goal) => (
                      <div key={goal.id} className="cursor-pointer" onClick={() => handleGoalClick(goal)}>
                        <GoalCard 
                          goal={goal} 
                          onEdit={handleEdit}
                          onStatusChange={handleStatusChange}
                          onCreateTask={handleCreateTaskFromGoal}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Done */}
              {filteredGoals.some(g => g.status === "Done") && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-green-400 border-b border-border pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    Done
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGoals.filter(g => g.status === "Done").map((goal) => (
                      <div key={goal.id} className="cursor-pointer" onClick={() => handleGoalClick(goal)}>
                        <GoalCard 
                          goal={goal} 
                          onEdit={handleEdit}
                          onStatusChange={handleStatusChange}
                          onCreateTask={handleCreateTaskFromGoal}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Archived */}
              {filteredGoals.some(g => g.status === "Archived") && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                    Archived
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGoals.filter(g => g.status === "Archived").map((goal) => (
                      <div key={goal.id} className="cursor-pointer" onClick={() => handleGoalClick(goal)}>
                        <GoalCard 
                          goal={goal} 
                          onEdit={handleEdit}
                          onStatusChange={handleStatusChange}
                          onCreateTask={handleCreateTaskFromGoal}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
            <HugeiconsIcon icon={Target02Icon} size={48} className="mx-auto mb-4 opacity-20" />
            <p>Không tìm thấy mục tiêu nào phù hợp.</p>
          </div>
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
