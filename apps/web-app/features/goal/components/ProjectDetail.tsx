import React from "react";
import { Goal } from "../types";
import { Task } from "@/features/board/types";
import { TaskList } from "./TaskList";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

interface ProjectDetailProps {
  goal: Goal;
  goalTasks: Task[];
  updateGoal: (id: string, data: Partial<Goal>) => Promise<unknown>;
}

export function ProjectDetail({
  goal,
  goalTasks,
  updateGoal,
}: ProjectDetailProps) {
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";

  const totalItems = goalTasks.length;
  const doneTasks = goalTasks.filter((t) => t.status === "Done").length;
  const pct = totalItems > 0 ? Math.round((doneTasks / totalItems) * 100) : 0;

  const handleMarkAsDone = async () => {
    try {
      await updateGoal(goal.id, { status: "Done" });
      toast.success(isVi ? "Chúc mừng! Đã hoàn thành cột mốc!" : "Congratulations! Milestone completed!");
    } catch {
      toast.error(isVi ? "Lỗi khi hoàn thành cột mốc." : "Error completing Milestone.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center justify-between">
        <div>
          <h3 className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
            {t.goals.projectProgress}
          </h3>
          <div className="text-2xl font-bold text-foreground">
            {doneTasks} / {totalItems} <span className="text-sm font-normal text-muted-foreground">{t.goals.itemsUnit}</span>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
            {isVi ? "Hoàn thành" : "Completed"}
          </h3>
          <div className="text-2xl font-bold text-primary">{pct}%</div>
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden -mt-2">
        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {pct === 100 && goal.status !== "Done" && (
        <div className="flex justify-center mt-2 mb-4">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white w-full" onClick={handleMarkAsDone}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="mr-2" />
            {isVi ? "Đánh dấu Cột mốc đã hoàn thành" : "Mark Milestone as Done"}
          </Button>
        </div>
      )}

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
        <TaskList
          taskList={goalTasks}
          gId={goal.id}
          gStatus={goal.status}
        />
      </div>
    </div>
  );
}
