"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyPlanAction } from "@/features/board/actions/plan.action";
import { saveTimeBlocksAction } from "@/features/board/actions/timeblock.action";
import { TaskTimeBlock } from "@/features/board/types";
import { getEventsAction } from "@/features/calendar/actions/calendar.action";
import { useAuthStore } from "@/features/auth";
import { autoSchedule, type OccupiedSlot } from "../utils/autoSchedule";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";


interface StartMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayStr: string;
}

const toLocalDateStr = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const toLocalTimeStr = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export function StartMyDayModal({ isOpen, onClose, todayStr }: StartMyDayModalProps) {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: dailyPlanToday } = useQuery({ queryKey: ['dailyPlan', todayStr], queryFn: () => getDailyPlanAction(todayStr) });
  


  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => saveTimeBlocksAction({ dailyPlanId: dailyPlanToday!.id, blocks }),
    onSuccess: (data) => {
      if (dailyPlanToday) {
        queryClient.setQueryData(['dailyPlan', todayStr], { ...dailyPlanToday, timeBlocks: data });
      }
      queryClient.invalidateQueries({ queryKey: ['dailyPlan', todayStr] });
    }
  });
  const user = useAuthStore((s) => s.user);

  const handleManualSchedule = async () => {
    onClose();
    router.push(`/calendar?view=day&date=${todayStr}`);
  };

  const handleAutoSchedule = async () => {
    if (!dailyPlanToday || !user?.wakeTime || !user?.sleepTime) {
      toast.error(t.startMyDay.errorAutoScheduleSetup);
      return;
    }

    setIsScheduling(true);
    try {
        const scheduledTaskIdsSet = new Set(dailyPlanToday.timeBlocks.map((b) => b.taskId));
        const unscheduledPlanTasks = dailyPlanToday.tasks.filter((pt) => !scheduledTaskIdsSet.has(pt.task.id));

        if (unscheduledPlanTasks.length === 0) {
          toast.info("Tất cả công việc đã được xếp lịch!");
          onClose();
          router.push(`/calendar?view=day&date=${todayStr}`);
          return;
        }

        const fixedEvents = await getEventsAction(todayStr, todayStr);
        const occupiedSlots: OccupiedSlot[] = [
          ...fixedEvents.map((event) => ({
            date: event.occurrenceDate,
            startTime: event.startTime.substring(0, 5),
            endTime: event.endTime.substring(0, 5),
          })),
          ...dailyPlanToday.timeBlocks.map((block) => ({
            date: toLocalDateStr(block.startTime),
            startTime: toLocalTimeStr(block.startTime),
            endTime: toLocalTimeStr(block.endTime),
          }))
        ];

        const newBlocks = autoSchedule(
          unscheduledPlanTasks,
          occupiedSlots,
          dailyPlanToday.id,
          todayStr,
          user.wakeTime,
          user.sleepTime,
          user.timezone
        );

        if (newBlocks.length === 0) {
          toast.warning(t.startMyDay.errorNoTimeLeft);
          onClose();
          router.push(`/calendar?view=day&date=${todayStr}`);
          return;
        }

        const existingCleanBlocks = dailyPlanToday.timeBlocks.map((b) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _, ...rest } = b;
          return rest as Omit<TaskTimeBlock, "id">;
        });

        await saveTimeBlocksMutation.mutateAsync([...existingCleanBlocks, ...newBlocks] as Omit<TaskTimeBlock, 'id'>[]);
        toast.success(t.startMyDay.successAutoSchedule);
        onClose();
        router.push(`/calendar?view=day&date=${todayStr}`);
    } catch (err) {
      console.error(err);
      toast.error(t.startMyDay.errorAutoSchedule);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[480px] bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <div className="flex items-center mb-1">
            <DialogTitle className="text-xl">{t.startMyDay.title}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed pt-1">
            {t.startMyDay.description(dailyPlanToday?.tasks?.length || 0)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4">
          {/* Auto Schedule Card */}
          <button
            onClick={handleAutoSchedule}
            disabled={isScheduling}
            className="group relative flex flex-col items-start p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center mb-2 w-full">
              <span className="font-semibold text-slate-100">{t.startMyDay.autoSchedule}</span>
              {isScheduling && <span className="text-xs text-primary animate-pulse ml-auto">{t.startMyDay.processing}</span>}
            </div>
            <p className="text-sm text-slate-400 leading-snug">
              {t.startMyDay.autoScheduleDesc}
            </p>
          </button>

          {/* Manual Schedule Card */}
          <button
            onClick={handleManualSchedule}
            className="group flex flex-col items-start p-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <div className="flex items-center mb-2">
              <span className="font-semibold text-slate-200">{t.startMyDay.manualSchedule}</span>
            </div>
            <p className="text-sm text-slate-400 leading-snug">
              {t.startMyDay.manualScheduleDesc}
            </p>
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
