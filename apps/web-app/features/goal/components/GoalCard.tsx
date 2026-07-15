"use client";

import { Goal, GoalUpdateRequest } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGoalAction } from "../actions/goal.action";
import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useTranslation } from "@/hooks/use-translation";

import { GoalStatusBadge } from "./GoalStatusBadge";
import { GoalProgressBar } from "./GoalProgressBar";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onCreateTask: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onCreateTask }: GoalCardProps) {
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: GoalUpdateRequest }) => updateGoalAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
  const updateGoal = useCallback((id: string, data: GoalUpdateRequest) => updateMutation.mutateAsync({ id, data }), [updateMutation]);
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

      toast.success(
        isVi
          ? `Chúc mừng! Mục tiêu "${goal.title}" đã đạt 100% tiến độ.`
          : `Congratulations! Goal "${goal.title}" has reached 100% progress.`,
        {
          action: {
            label: isVi ? "Đóng mục tiêu" : "Close Goal",
            onClick: () => {
              updateGoal(goal.id, { status: "Done" });
            }
          },
          duration: 10000,
        }
      );
    }
    prevPctRef.current = pct;
  }, [pct, goal.status, goal.id, goal.title, updateGoal, isVi]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <GoalStatusBadge status={goal.status} />
          <Badge variant="secondary" className="bg-secondary/50 text-xs">
            {goal.goalType === 'Binary' && <HugeiconsIcon icon={Folder01Icon} size={12} className="mr-1 inline-block" />}
            {goal.goalType === 'Binary' ? t.goals.project : t.goals.habit}
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
              ({Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t.goals.daysUnit})
            </span>
          )}
        </div>
      )}

      <GoalProgressBar 
        goalType={goal.goalType} 
        progressPct={pct} 
        durationMinutes={goal.durationMinutes} 
      />

      <div className="pt-3 flex gap-2 border-t border-border/50 mt-auto">
        {goal.goalType !== 'Binary' && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full text-xs"
            disabled={goal.status !== "In Progress"}
            onClick={(e) => { e.stopPropagation(); onCreateTask(goal.id); }}
          >
            {t.goals.createTaskFromGoal}
          </Button>
        )}
      </div>
    </div>
  );
}
