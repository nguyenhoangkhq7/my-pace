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
import { reviewPlanAction } from "../actions/plan.action";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

interface OutstandingTasksModalProps {
  isOpen: boolean;
  unreviewedPlan: DailyPlan;
  currentDate: string;
}

export function OutstandingTasksModal({ isOpen, unreviewedPlan, currentDate }: OutstandingTasksModalProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show tasks that are not yet completed
  const uncompletedPlanTasks = unreviewedPlan.tasks?.filter(pt => pt.task?.status !== "Done") || [];

  // Per-task choice: 'today' (default) | 'backlog' | 'delete'
  const [choices, setChoices] = useState<Record<string, "today" | "backlog" | "delete">>(() => {
    const initial: Record<string, "today" | "backlog" | "delete"> = {};
    uncompletedPlanTasks.forEach(pt => {
      if (pt.task?.id) initial[pt.task.id] = "today";
    });
    return initial;
  });

  const handleChoiceChange = (taskId: string, choice: "today" | "backlog" | "delete") => {
    setChoices(prev => ({ ...prev, [taskId]: choice }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const taskReviews = uncompletedPlanTasks
        .map(pt => {
          const taskId = pt.task?.id;
          if (!taskId) return null;
          const choice = choices[taskId];
          return {
            taskId,
            action: choice.toUpperCase(), // "TODAY" | "BACKLOG" | "DELETE"
          };
        })
        .filter((item): item is { taskId: string; action: string } => item !== null);

      // Submit all choices at once
      await reviewPlanAction(unreviewedPlan.planDate, {
        today: currentDate,
        taskReviews,
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["unreviewedPlan"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });

      toast.success(t.outstanding.successMessage);
    } catch (err) {
      console.error("[OutstandingTasksModal] submit error:", err);
      toast.error(t.outstanding.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (uncompletedPlanTasks.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-card text-card-foreground border-border sm:max-w-[600px] max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl">
              ☀️
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              {t.outstanding.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-1">
            {t.outstanding.description(unreviewedPlan.planDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3.5 scrollbar-thin">
          {uncompletedPlanTasks.map(pt => {
            const task = pt.task;
            if (!task) return null;
            const currentChoice = choices[task.id] ?? "today";

            return (
              <div
                key={task.id}
                className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col gap-3 hover:border-border/80 transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate" title={task.title}>
                      {task.title}
                    </div>
                    {task.category && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1.5"
                        style={{
                          backgroundColor: `${task.category.color}10`,
                          color: task.category.color,
                          borderColor: `${task.category.color}25`,
                        }}
                      >
                        {task.category.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Move to Today */}
                  <button
                    type="button"
                    onClick={() => handleChoiceChange(task.id, "today")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentChoice === "today"
                        ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/30"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {t.outstanding.moveToToday}
                  </button>

                  {/* Return to Backlog */}
                  <button
                    type="button"
                    onClick={() => handleChoiceChange(task.id, "backlog")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentChoice === "backlog"
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/30"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {t.outstanding.moveToBacklog}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleChoiceChange(task.id, "delete")}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentChoice === "delete"
                        ? "bg-red-600/10 text-red-400 border-red-500/30"
                        : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {t.outstanding.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-5 border-t border-border pt-4 shrink-0 flex items-center justify-end gap-3">
          <Button
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-5 rounded-xl text-xs cursor-pointer shadow-lg shadow-primary/10 transition-all"
            onClick={handleSubmit}
          >
            {isSubmitting ? t.outstanding.processing : t.outstanding.confirmBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
