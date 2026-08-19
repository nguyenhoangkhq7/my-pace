"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";
import { useTranslation } from "@/hooks/use-translation";
import type { Task, TaskTimeBlock } from "../types";

import { useCategories } from "../hooks/useCategories";

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
  const { categories } = useCategories();
  const [isToggling, setIsToggling] = React.useState(false);

  if (!block || !task) return null;

  const category = task.category || categories.find((c) => c.id === task.categoryId);

  const startTimeStr = new Date(block.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = new Date(block.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = new Date(block.startTime).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  const isToday = new Date(block.startTime).toDateString() === new Date().toDateString();

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
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold leading-snug">{t.timeblock.detailDesc || "Timeblock Details"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1 w-full min-w-0 overflow-hidden">
          
          {/* Thông tin Task cơ bản */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Task Information</h4>
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border space-y-3">
              <div className="font-semibold text-sm text-foreground leading-snug break-all">
                {task.title}
              </div>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {isMit && (
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px] px-1.5 py-0">
                    MIT
                  </Badge>
                )}
                {task.goalId && (
                  <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] px-1.5 py-0">
                    Goal
                  </Badge>
                )}
                {category && (
                  <Badge
                    className="hover:brightness-110 text-[10px] px-1.5 py-0"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                      borderColor: `${category.color}30`,
                    }}
                    variant="outline"
                  >
                    {category.name}
                  </Badge>
                )}
                {isChunked && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {t.timeblock.part(block.partIndex, block.totalParts)}
                  </Badge>
                )}
              </div>

              <div className="flex justify-between items-center text-[13px] pt-2 border-t border-border/50">
                <span className="text-muted-foreground">{t.timeblock.estimatedTime}</span>
                <span className="font-medium text-foreground">{task.estimatedMinutes || 0} phút</span>
              </div>

              {task.notes && (
                <div className="text-[13px] pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block mb-1">{t.timeblock.notes}</span>
                  <p className="text-foreground/90 whitespace-pre-wrap break-all leading-relaxed">
                    {task.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin Timeblock */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Timeblock Allocation</h4>
            
            <div className="flex items-center gap-3 p-3.5 bg-primary/5 rounded-xl border border-primary/20">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                <HugeiconsIcon icon={Clock01Icon} size={16} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground text-sm tracking-tight leading-none mb-1">
                  {startTimeStr} - {endTimeStr}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar01Icon} size={12} />
                  {dateStr}
                </div>
              </div>
            </div>

            {isChunked && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2 leading-relaxed font-medium">
                {t.timeblock.chunkedWarning}
              </p>
            )}
          </div>

        </div>

        <DialogFooter className="flex gap-2 flex-wrap">
          {!isConfirmed && isToday && onToggleLock && block.id && (
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
          {!isConfirmed && isToday && (
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
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto text-muted-foreground hover:text-foreground">
            {t.timeblock.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
