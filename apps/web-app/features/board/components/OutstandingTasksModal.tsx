"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DailyPlan } from "../types";
import { useReviewPlan } from "../hooks/useReviewPlan";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { RolloverTaskItem } from "./RolloverTaskItem";
import { Sparkles, CheckCheck } from "lucide-react";

interface OutstandingTasksModalProps {
  isOpen: boolean;
  unreviewedPlan: DailyPlan;
  currentDate: string;
}

export function OutstandingTasksModal({ isOpen, unreviewedPlan, currentDate }: OutstandingTasksModalProps) {
  const { reviewPlan, isReviewing } = useReviewPlan();
  const { t } = useTranslation();

  const uncompletedPlanTasks = unreviewedPlan.tasks?.filter(pt => pt.task?.status !== "Done") || [];

  const [choices, setChoices] = useState<Record<string, "today" | "backlog" | "done" | "delete">>(() => {
    const initial: Record<string, "today" | "backlog" | "done" | "delete"> = {};
    uncompletedPlanTasks.forEach(pt => {
      if (pt.task?.id) initial[pt.task.id] = "today";
    });
    return initial;
  });

  const inProgressTasks = uncompletedPlanTasks.filter(
    pt => pt.task && (pt.task.isSplittable || (pt.task.actualMinutes && pt.task.actualMinutes > 0))
  );
  const unstartedTasks = uncompletedPlanTasks.filter(
    pt => pt.task && !pt.task.isSplittable && (!pt.task.actualMinutes || pt.task.actualMinutes === 0)
  );

  const handleChoiceChange = (taskId: string, choice: "today" | "backlog" | "done" | "delete") => {
    setChoices(prev => ({ ...prev, [taskId]: choice }));
  };

  const handleSelectAllToday = () => {
    const updated: Record<string, "today" | "backlog" | "done" | "delete"> = {};
    uncompletedPlanTasks.forEach(pt => {
      if (pt.task?.id) updated[pt.task.id] = "today";
    });
    setChoices(updated);
  };

  const handleSubmit = async () => {
    try {
      const taskReviews = uncompletedPlanTasks
        .map(pt => {
          const taskId = pt.task?.id;
          if (!taskId) return null;
          const choice = choices[taskId] || "today";
          return { taskId, action: choice.toUpperCase() };
        })
        .filter((item): item is { taskId: string; action: string } => item !== null);

      await reviewPlan({ planDate: unreviewedPlan.planDate, today: currentDate, taskReviews });
      toast.success(t.outstanding.successMessage);
    } catch (err) {
      console.error("[OutstandingTasksModal] submit error:", err);
      toast.error(t.outstanding.errorMessage);
    }
  };

  if (uncompletedPlanTasks.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-card text-card-foreground border-border sm:max-w-[620px] max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl shrink-0">
              ☀️
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-foreground">
                {t.outstanding.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-0.5">
                {t.outstanding.description(unreviewedPlan.planDate)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4 scrollbar-thin">
          {/* In progress section */}
          {inProgressTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.outstanding.inProgressSection}</span>
              </div>
              <div className="space-y-2.5">
                {inProgressTasks.map(pt => pt.task && (
                  <RolloverTaskItem
                    key={pt.task.id}
                    task={pt.task}
                    isInProgress={true}
                    currentChoice={choices[pt.task.id] || "today"}
                    onChoiceChange={(choice) => handleChoiceChange(pt.task.id, choice)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unstarted section */}
          {unstartedTasks.length > 0 && (
            <div className="space-y-2.5">
              {inProgressTasks.length > 0 && (
                <div className="text-xs font-semibold text-muted-foreground pt-1">
                  {t.outstanding.unstartedSection}
                </div>
              )}
              <div className="space-y-2.5">
                {unstartedTasks.map(pt => pt.task && (
                  <RolloverTaskItem
                    key={pt.task.id}
                    task={pt.task}
                    isInProgress={false}
                    currentChoice={choices[pt.task.id] || "today"}
                    onChoiceChange={(choice) => handleChoiceChange(pt.task.id, choice)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t border-border pt-4 shrink-0 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAllToday}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 h-8"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t.outstanding.continueAll}</span>
          </Button>

          <Button
            disabled={isReviewing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-5 rounded-xl text-xs cursor-pointer shadow-lg shadow-primary/10 transition-all"
            onClick={handleSubmit}
          >
            {isReviewing ? t.outstanding.processing : t.outstanding.confirmBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
