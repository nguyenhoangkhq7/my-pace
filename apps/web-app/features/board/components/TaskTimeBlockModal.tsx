"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";
import { useTranslation } from "@/hooks/use-translation";
import type { Task, TaskTimeBlock } from "../types";

interface TaskTimeBlockModalProps {
  open: boolean;
  block: TaskTimeBlock | null;
  task: Task | null;
  isMit: boolean;
  isConfirmed?: boolean;
  onClose: () => void;
  onUnschedule: (taskId: string) => Promise<void>;
  onToggleLock?: (blockId: string, currentStatus: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function TaskTimeBlockModal({
  open,
  block,
  task,
  isMit,
  isConfirmed = false,
  onClose,
  onUnschedule,
  onToggleLock,
  isSubmitting = false,
}: TaskTimeBlockModalProps) {
  const { t } = useTranslation();
  const [isToggling, setIsToggling] = React.useState(false);

  if (!block || !task) return null;

  const startTimeStr = new Date(block.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = new Date(block.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = new Date(block.startTime).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const handleUnschedule = () => {
    onUnschedule(task.id);
  };

  const isChunked = block.totalParts > 1;
  const handleToggleLock = async () => {
    if (onToggleLock && block.id) {
      setIsToggling(true);
      await onToggleLock(block.id, block.availabilityStatus || 'FREE');
      setIsToggling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isMit && (
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px]">
                MIT
              </Badge>
            )}
            {task.goalId ? (
              <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px]">
                Goal
              </Badge>
            ) : task.category ? (
              <Badge
                className="hover:brightness-110 text-[10px]"
                style={{
                  backgroundColor: `${task.category.color}15`,
                  color: task.category.color,
                  borderColor: `${task.category.color}30`,
                }}
                variant="outline"
              >
                {task.category.name}
              </Badge>
            ) : null}
            {isChunked && (
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[10px]">
                {t.timeblock.part(block.partIndex, block.totalParts)}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold leading-snug break-all">{task.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {t.timeblock.detailDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-3 w-full min-w-0 overflow-hidden">
          {/* Thời gian */}
          <div className="flex items-start gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <HugeiconsIcon icon={Clock01Icon} size={18} />
            </div>
            <div>
              <div className="font-semibold text-slate-200">
                {startTimeStr} - {endTimeStr}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <HugeiconsIcon icon={Calendar01Icon} size={12} />
                {dateStr}
              </div>
            </div>
          </div>

          {/* Ghi chú và Ước lượng */}
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-xs font-medium text-muted-foreground">{t.timeblock.estimatedTime}</span>
              <span className="text-slate-200">{task.estimatedMinutes || 0} phút</span>
            </div>

            {task.notes && (
              <div className="flex flex-col gap-1 w-full min-w-0 overflow-hidden">
                <span className="text-sm text-slate-400 font-medium">{t.timeblock.notes}</span>
                <p className="text-sm text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap break-all">
                  {task.notes}
                </p>
              </div>
            )}

            {isChunked && (
              <p className="text-xs text-amber-400/90 bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-2.5 leading-relaxed">
                {t.timeblock.chunkedWarning}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 flex-wrap">
          {!isConfirmed && onToggleLock && block.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleLock}
              disabled={isSubmitting || isToggling}
              className="w-full sm:w-auto mr-auto"
            >
              {block.availabilityStatus === 'BUSY' ? 'Mở khóa (Unlock)' : 'Khóa (Lock)'}
            </Button>
          )}
          {!isConfirmed && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUnschedule}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? t.timeblock.unscheduling : t.timeblock.unschedule}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto text-slate-400">
            {t.timeblock.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
