"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { useDailyPlan } from "@/features/board/hooks/useDailyPlan";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { fetchClient } from "@/lib/fetchClient";
import { useQueryClient } from "@tanstack/react-query";

interface StartMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayStr: string;
}

export function StartMyDayModal({ isOpen, onClose, todayStr }: StartMyDayModalProps) {
  const router = useRouter();
  const [isScheduling, setIsScheduling] = useState(false);
  const { t } = useTranslation();
  const { dailyPlan: dailyPlanToday } = useDailyPlan(todayStr);
  const queryClient = useQueryClient();

  const handleManualSchedule = async () => {
    onClose();
    router.push(`/calendar?view=day&date=${todayStr}`);
  };

  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    try {
      await fetchClient.post("auto-schedule", {});
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
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
