"use client";

import { Goal } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, CheckmarkCircle01Icon, PauseIcon, Archive02Icon, Edit01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { useGoalStore } from "../store/goal.store";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;

  onCreateTask: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onCreateTask }: GoalCardProps) {
  const updateGoal = useGoalStore(s => s.updateGoal);
  const prevPctRef = useRef(goal.progressPct || 0);

  const pct = goal.progressPct || 0;

  useEffect(() => {
    if (pct >= 100 && prevPctRef.current < 100 && goal.status !== "Done") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
      });

      toast.success(`Chúc mừng! Mục tiêu "${goal.title}" đã đạt 100% tiến độ.`, {
        action: {
          label: "Đóng mục tiêu",
          onClick: () => {
            updateGoal(goal.id, { status: "Done" });
          }
        },
        duration: 10000,
      });
    }
    prevPctRef.current = pct;
  }, [pct, goal.status, goal.id, goal.title, updateGoal]);

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
            {goal.goalType === 'Binary' && <HugeiconsIcon icon={Folder01Icon} size={12} className="mr-1 inline-block" />}
            {goal.goalType === 'Binary' ? 'Project' : goal.goalType === 'Time-boxed' ? 'Habit' : 'Target'}
          </Badge>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
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
        <div className="text-sm text-muted-foreground mb-4 flex-1 flex flex-col">
          <div className="font-medium text-foreground mb-2 flex justify-between text-xs">
            <span>Tiến độ thực thi</span>
            <span className="text-primary font-bold">{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-2 mb-1 overflow-hidden">
            <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }}></div>
          </div>
          <div className="text-[10px] text-right mb-3">
            {goal.timeBoxedGoal.accumulatedMinutes || 0} phút
          </div>
          
          <div className="mt-auto bg-muted/30 p-2 rounded-md text-xs text-center border border-border/30">
            Cam kết: <strong className="text-foreground">{goal.timeBoxedGoal.targetMinutes}</strong> phút mỗi <strong className="text-foreground">{goal.timeBoxedGoal.periodDays}</strong> ngày
          </div>
        </div>
      )}

      {goal.goalType === "Milestone" && goal.milestoneGoal && (
        <div className="text-sm text-muted-foreground mb-4 flex-1 flex flex-col">
          <div className="font-medium text-foreground mb-2 flex justify-between text-xs">
            <span>Tiến độ ({goal.milestoneGoal.currentCount || 0}/{goal.milestoneGoal.targetCount})</span>
            <span className="text-primary font-bold">{Math.round(pct)}%</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2 mb-3">
            {Array.from({ length: Math.min(goal.milestoneGoal.targetCount, 20) }).map((_, i) => {
              const isAchieved = i < (goal.milestoneGoal?.currentCount || 0);
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-sm border ${isAchieved ? 'bg-primary border-primary' : 'bg-secondary border-border'}`}
                  title={isAchieved ? "Đã hoàn thành" : "Chưa hoàn thành"}
                />
              )
            })}
            {goal.milestoneGoal.targetCount > 20 && (
              <span className="text-[10px] opacity-70 ml-1 leading-4">+{goal.milestoneGoal.targetCount - 20}</span>
            )}
          </div>
        </div>
      )}

      {goal.goalType === "Binary" && (
        <div className="text-sm text-muted-foreground mb-4 flex-1 flex flex-col justify-center">
          <div className="font-medium text-foreground mb-2 flex justify-between text-xs">
            <span>Tiến độ dự án</span>
            <span className="text-primary font-bold">{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-2 mb-4 overflow-hidden mt-auto">
            <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }}></div>
          </div>
        </div>
      )}

      <div className="pt-3 flex gap-2 border-t border-border/50 mt-auto">
        {goal.goalType !== 'Binary' && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full text-xs"
            disabled={goal.status !== "In Progress"}
            onClick={(e) => { e.stopPropagation(); onCreateTask(goal.id); }}
          >
            + Tạo Task từ Goal
          </Button>
        )}
      </div>
    </div>
  );
}
