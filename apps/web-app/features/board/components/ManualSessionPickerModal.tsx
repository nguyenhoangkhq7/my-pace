"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Task } from "../types";

interface ManualSessionPickerModalProps {
  open: boolean;
  task: Task | null;
  maxAvailableMinutes?: number;
  onConfirm: (sessionMinutes: number) => void;
  onClose: () => void;
}

const PRESET_DURATIONS = [30, 45, 60, 90, 120];

export function ManualSessionPickerModal({
  open,
  task,
  onConfirm,
  onClose,
}: ManualSessionPickerModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const [customMinutes, setCustomMinutes] = useState<string>("");

  if (!task) return null;

  const totalMinutes = task.estimatedMinutes || 60;
  const remainingMinutes = Math.max(0, totalMinutes - (task.actualMinutes || 0));

  const handleSelect = (mins: number) => {
    setSelectedMinutes(mins);
    setCustomMinutes("");
  };

  const handleConfirm = () => {
    const mins = customMinutes ? Number(customMinutes) : selectedMinutes;
    if (mins > 0) {
      onConfirm(mins);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
              {remainingMinutes}m còn lại
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold leading-snug">{task.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Task này dài {totalMinutes}m ({Math.round(totalMinutes / 60)}h). Chọn thời lượng phiên bạn muốn xếp vào lịch:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-2">
            {PRESET_DURATIONS.map((mins) => (
              <Button
                key={mins}
                type="button"
                variant={selectedMinutes === mins && !customMinutes ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelect(mins)}
                className="flex-1 min-w-[60px]"
              >
                {mins}m
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground shrink-0">Tự nhập:</span>
            <Input
              type="number"
              placeholder="Số phút"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="h-8 text-sm bg-slate-900 border-slate-800"
            />
            <span className="text-xs text-muted-foreground">phút</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400">
            Hủy
          </Button>
          <Button size="sm" onClick={handleConfirm} className="bg-indigo-600 hover:bg-indigo-500">
            Xác nhận xếp {customMinutes || selectedMinutes}m
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
