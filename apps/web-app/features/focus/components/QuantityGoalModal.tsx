import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Goal } from "@/features/goal/types";

interface QuantityGoalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  quantityGoal: Goal | null;
  addedCount: string;
  setAddedCount: (count: string) => void;
  onConfirm: (count: number) => void;
  isFinishing: boolean;
}

export function QuantityGoalModal({
  isOpen,
  onOpenChange,
  quantityGoal,
  addedCount,
  setAddedCount,
  onConfirm,
  isFinishing,
}: QuantityGoalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-wide">Cập nhật số lượng mục tiêu</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Nhập số lượng hoàn thành cho: <span className="text-indigo-400 font-semibold">{quantityGoal?.title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Số lượng</label>
          <Input
            type="number"
            min="1"
            value={addedCount}
            onChange={(e) => setAddedCount(e.target.value)}
            className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
          />
        </div>
        <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" className="border-border hover:bg-muted text-muted-foreground" onClick={() => onOpenChange(false)} disabled={isFinishing}>
            Hủy
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold" onClick={() => onConfirm(Number(addedCount) || 1)} disabled={isFinishing}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
