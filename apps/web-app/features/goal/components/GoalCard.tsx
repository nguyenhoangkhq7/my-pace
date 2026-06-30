"use client";

import { Goal } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, CheckmarkCircle01Icon, PauseIcon, Target02Icon, Archive02Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import { useBoardStore } from "@/features/board/store/board.store";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onStatusChange: (goal: Goal, newStatus: string) => void;
  onCreateTask: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onStatusChange, onCreateTask }: GoalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Done": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Archived": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-orange-500/10 text-orange-500 border-orange-500/20"; // Freeze
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress": return <HugeiconsIcon icon={PlayIcon} size={14} className="mr-1" />;
      case "Done": return <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-1" />;
      case "Archived": return <HugeiconsIcon icon={Archive02Icon} size={14} className="mr-1" />;
      default: return <HugeiconsIcon icon={PauseIcon} size={14} className="mr-1" />; // Freeze
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(goal.status)}>
            {getStatusIcon(goal.status)}
            {goal.status}
          </Badge>
          <Badge variant="secondary" className="bg-secondary/50 text-xs">
            {goal.goalType}
          </Badge>
        </div>
        <button
          onClick={() => onEdit(goal)}
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <HugeiconsIcon icon={Edit01Icon} size={16} />
        </button>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
        {goal.title}
      </h3>
      
      {(goal.startDate || goal.endDate) && (
        <div className="text-xs text-muted-foreground mb-4">
          {goal.startDate} {goal.endDate ? `→ ${goal.endDate}` : ''}
          {goal.startDate && goal.endDate && (
            <span className="ml-1 text-primary">
              ({Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24))} ngày)
            </span>
          )}
        </div>
      )}

      {goal.goalType === "Time-boxed" && goal.timeBoxedGoal && (
        <div className="text-sm text-muted-foreground mb-4 bg-muted/30 p-2 rounded-md">
          <span className="block"><strong className="text-foreground">{goal.timeBoxedGoal.targetMinutes}</strong> phút mỗi <strong className="text-foreground">{goal.timeBoxedGoal.periodDays}</strong> ngày</span>
        </div>
      )}

      {goal.goalType === "Milestone" && goal.milestones && (
        <div className="text-sm text-muted-foreground mb-4 flex-1">
          <div className="font-medium text-foreground mb-1">Cột mốc ({goal.milestones.filter(m => m.isDone).length}/{goal.milestones.length})</div>
          <ul className="space-y-1">
            {goal.milestones.slice(0, 3).map(m => (
              <li key={m.id} className="flex items-start gap-1.5 text-xs">
                <HugeiconsIcon icon={m.isDone ? CheckmarkCircle01Icon : Target02Icon} size={14} className={m.isDone ? "text-emerald-500" : "text-muted-foreground"} />
                <span className={m.isDone ? "line-through opacity-70" : ""}>{m.title}</span>
              </li>
            ))}
            {goal.milestones.length > 3 && <li className="text-xs opacity-70 italic">+{goal.milestones.length - 3} cột mốc khác...</li>}
          </ul>
        </div>
      )}

      {goal.goalType === "Binary" && <div className="flex-1" />}

      <div className="mt-auto pt-4 flex gap-2 border-t border-border/50">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full"
          disabled={goal.status !== "In Progress"}
          onClick={() => onCreateTask(goal.id)}
        >
          + Tạo Task từ Goal
        </Button>
      </div>
    </div>
  );
}
