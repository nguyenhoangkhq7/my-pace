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
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Target02Icon, PlusSignIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";

export function GoalDashboard() {
  const { goals, fetchGoals, isLoading, updateGoal, error } = useGoalStore();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // For Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [prefilledGoalId, setPrefilledGoalId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Handle errors from backend e.g. Limit Exceeded
  useEffect(() => {
    if (error) {
      toast.error(error);
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

  const handleStatusChange = async (goal: Goal, newStatus: string) => {
    try {
      await updateGoal(goal.id, { status: newStatus as any });
      toast.success(`Đã cập nhật Goal thành ${newStatus}`);
    } catch (e: any) {
      // Error is handled by store + useEffect
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <HugeiconsIcon icon={Target02Icon} className="text-primary" size={32} />
            Mục Tiêu
          </h1>
          <p className="text-muted-foreground mt-2">Quản lý các mục tiêu dài hạn và theo dõi tiến độ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsRulesModalOpen(true)} className="text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mr-2" />
            Hướng dẫn
          </Button>
          <Button onClick={handleCreateNew} size="lg" className="shadow-lg hover:shadow-primary/25 transition-all">
            <HugeiconsIcon icon={PlusSignIcon} size={18} className="mr-2" />
            Tạo Goal
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Loại Goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            <SelectItem value="Time-boxed">Time-boxed</SelectItem>
            <SelectItem value="Milestone">Milestone</SelectItem>
            <SelectItem value="Binary">Binary</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Freeze">Freeze</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {isLoading && goals.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGoals.map((goal) => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                onCreateTask={handleCreateTaskFromGoal}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
            <HugeiconsIcon icon={Target02Icon} size={48} className="mx-auto mb-4 opacity-20" />
            <p>Không tìm thấy mục tiêu nào phù hợp.</p>
          </div>
        )}
      </div>

      <GoalFormModal 
        isOpen={isGoalModalOpen} 
        onOpenChange={setIsGoalModalOpen} 
        goal={selectedGoal} 
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
