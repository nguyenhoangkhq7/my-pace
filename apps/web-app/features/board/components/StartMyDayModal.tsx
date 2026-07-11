"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBoardStore } from "../store/board.store";
import { useCalendarStore } from "@/features/calendar/store/calendar.store";
import { useAuthStore } from "@/features/auth";
import { autoSchedule, type OccupiedSlot } from "../utils/autoSchedule";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

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
  const { dailyPlanToday, saveTimeBlocks, confirmPlan } = useBoardStore();
  const { events: fixedEvents } = useCalendarStore();
  const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore();
  const user = useAuthStore((s) => s.user);

  const handleManualSchedule = async () => {
    try {
      await confirmPlan(todayStr);
      onClose();
      router.push(`/calendar?view=day&date=${todayStr}`);
      if (isTourActive && tourStepIndex === 8) {
        // Advance to step 9 (drag-drop on calendar) after a short delay for navigation
        setTimeout(() => advanceTourStep(), 600);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.startMyDay.errorConfirm);
    }
  };

  const handleAutoSchedule = async () => {
    if (!dailyPlanToday || !user?.wakeTime || !user?.sleepTime) {
      toast.error(t.startMyDay.errorAutoScheduleSetup);
      return;
    }

    setIsScheduling(true);
    try {
        const occupiedSlots: OccupiedSlot[] = fixedEvents.map((event) => ({
          date: event.occurrenceDate,
          startTime: event.startTime.substring(0, 5),
          endTime: event.endTime.substring(0, 5),
        }));

        const existingBlocks = dailyPlanToday.timeBlocks.map((block) => ({
          date: toLocalDateStr(block.startTime),
          startTime: toLocalTimeStr(block.startTime),
          endTime: toLocalTimeStr(block.endTime),
        }));

        const blocks = autoSchedule(
          dailyPlanToday.tasks,
          [...occupiedSlots, ...existingBlocks],
          dailyPlanToday.id,
          todayStr,
          user.wakeTime,
          user.sleepTime
        );

        if (blocks.length === 0) {
          toast.warning(t.startMyDay.errorNoTimeLeft);
          onClose();
          return;
        }

        await saveTimeBlocks(blocks);
        await confirmPlan(todayStr);
        toast.success(t.startMyDay.successAutoSchedule);
        onClose();
        router.push(`/calendar?view=day&date=${todayStr}`);
        if (isTourActive && tourStepIndex === 8) {
          setTimeout(() => advanceTourStep(), 500); // Wait for route & modal animation
        }
    } catch (err) {
      console.error(err);
      toast.error(t.startMyDay.errorAutoSchedule);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog modal={!isTourActive} open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (isTourActive) return;
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[480px] bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">🚀</div>
            <DialogTitle className="text-xl">{t.startMyDay.title}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-sm leading-relaxed pt-1">
            {t.startMyDay.description(dailyPlanToday?.tasks?.length || 0)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4 tour-schedule-area">
          {/* Auto Schedule Card */}
          <button
            onClick={handleAutoSchedule}
            disabled={isScheduling}
            className="group relative flex flex-col items-start p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-lg">⚡</div>
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
            className="tour-manual-schedule-btn group flex flex-col items-start p-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-lg">✋</div>
              <span className="font-semibold text-slate-200">{t.startMyDay.manualSchedule}</span>
            </div>
            <p className="text-sm text-slate-400 leading-snug">
              {t.startMyDay.manualScheduleDesc}
            </p>
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            {t.startMyDay.skipJustList}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
