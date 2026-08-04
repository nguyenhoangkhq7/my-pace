import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Task } from "@/features/board/types";
import { TaskFormModal } from "@/features/board/components/TaskFormModal";
import { FlowReviewModal } from "./FlowReviewModal";
import { FlowPickTaskModal } from "./FlowPickTaskModal";
import { useTranslation } from "@/hooks/use-translation";
import { useFlowEmptyState } from "@/features/focus/hooks/useFlowEmptyState";

export function FlowEmptyState() {
  const { t, locale } = useTranslation();
  const {
    tasks,
    dailyPlanToday,
    dataToday,
    addAndSaveTask,
    handleDurationSubmit,
    handleReviewConfirm,
  } = useFlowEmptyState();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPickTaskModalOpen, setIsPickTaskModalOpen] = useState(false);
  const [requireDurationForTask, setRequireDurationForTask] = useState<Task | undefined>(undefined);

  const allDone = !!dailyPlanToday?.tasks && dailyPlanToday.tasks.length > 0 && dailyPlanToday.tasks.every(t => t.task.status === "Done");

  if (allDone) {
    const totalMinutes = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.actualMinutes || 0), 0);
    const totalEstimated = dailyPlanToday.tasks.reduce((sum, pt) => sum + (pt.task.estimatedMinutes || 0), 0);
    const completedCount = dailyPlanToday.tasks.length;
    const isReviewed = dailyPlanToday?.isReviewed || false;
    const remainingMinutes = dataToday?.availableMinutes ?? 0;

    const backlogTasks = tasks.filter(
      (t) => t.status !== "Done" && !dailyPlanToday.tasks.some((pt) => pt.task.id === t.id)
    );

    const handlePickTask = async (task: Task) => {
      if (!task.estimatedMinutes) {
        setRequireDurationForTask(task);
        return;
      }
      try {
        await addAndSaveTask(task);
        setIsReviewModalOpen(false);
        toast.success(
          locale === "vi"
            ? `Đã thêm công việc "${task.title}" vào kế hoạch hôm nay!`
            : `Added task "${task.title}" to today's plan!`
        );
      } catch (err) {
        console.error(err);
        toast.error(
          locale === "vi"
            ? "Không thể thêm công việc vào kế hoạch."
            : "Could not add task to today's plan."
        );
      }
    };

    const onSubmitDuration = async (taskData: Partial<Task>) => {
      if (!requireDurationForTask) return;
      try {
        await handleDurationSubmit(requireDurationForTask, taskData, () => {
          setRequireDurationForTask(undefined);
        });
        setIsReviewModalOpen(false);
        toast.success(
          locale === "vi"
            ? `Đã thêm công việc "${requireDurationForTask.title}" vào kế hoạch hôm nay!`
            : `Added task "${requireDurationForTask.title}" to today's plan!`
        );
      } catch (err) {
        console.error(err);
        toast.error(
          locale === "vi"
            ? "Không thể cập nhật thời gian cho công việc."
            : "Could not update task duration."
        );
      }
    };

    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-6 relative w-full overflow-y-auto scrollbar-thin">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-background to-background pointer-events-none"></div>
        
        <div className="max-w-md text-center space-y-6 relative z-10 flex flex-col items-center w-full py-8">
          {isReviewed ? (
            <div className="space-y-4">
              <svg className="w-16 h-16 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-3xl font-black text-foreground tracking-wide">{t.flow.great}</h2>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                {t.flow.allTasksDone}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <svg className="w-16 h-16 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h2 className="text-3xl font-black text-foreground tracking-wide">{t.flow.planCompleted}</h2>
              <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                {t.flow.lookBack}
              </p>
              <Button onClick={() => setIsReviewModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-full mt-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer">
                {t.flow.endOfDayReview}
              </Button>
            </div>
          )}
        </div>

        <FlowReviewModal
          isOpen={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          completedCount={completedCount}
          totalMinutes={totalMinutes}
          totalEstimated={totalEstimated}
          remainingMinutes={remainingMinutes}
          backlogTasks={backlogTasks}
          onReviewConfirm={async () => {
            setIsReviewModalOpen(false);
            await handleReviewConfirm();
          }}
          onPickTaskClick={() => setIsPickTaskModalOpen(true)}
        />

        <FlowPickTaskModal
          isOpen={isPickTaskModalOpen}
          onOpenChange={setIsPickTaskModalOpen}
          backlogTasks={backlogTasks}
          onPickTask={handlePickTask}
        />

        <TaskFormModal 
          isOpen={!!requireDurationForTask} 
          onClose={() => setRequireDurationForTask(undefined)} 
          onSubmit={onSubmitDuration}
          initialData={requireDurationForTask}
          requireDuration={true}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background p-6 relative w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/15 via-background to-background pointer-events-none"></div>
      <div className="max-w-md text-center space-y-6 relative z-10">
        <svg className="w-16 h-16 text-muted-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-foreground tracking-wide">{t.flow.readyToFocus}</h2>
        <p className="text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
          {t.flow.selectLeftTask}
        </p>
      </div>
    </div>
  );
}
