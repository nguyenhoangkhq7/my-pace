"use client";

import React, { useState } from "react";
import { fetchClient } from "@/lib/fetchClient";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Pin } from "lucide-react";
import { toast } from "sonner";

interface LockTimeBlockButtonProps {
  blockId: string;
  isLocked?: boolean;
  isInDailyPlan?: boolean;
}

export function LockTimeBlockButton({
  blockId,
  isLocked = false,
  isInDailyPlan = false,
}: LockTimeBlockButtonProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Hide button completely if task is not in Daily Plan
  if (!isInDailyPlan) return null;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await fetchClient.patch(`time-blocks/${blockId}/toggle-lock`, {});
      await queryClient.invalidateQueries({ queryKey: ["timeBlocks"] });
      await queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });
      await queryClient.invalidateQueries({ queryKey: ["dailyPlans"] });
      toast.success(isLocked ? "Đã bỏ ghim ô thời gian" : "Đã ghim ô thời gian cố định");
    } catch (err) {
      console.error(err);
      toast.error("Không thể thay đổi trạng thái ghim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer ${
        isLocked
          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${loading ? "opacity-50 cursor-wait" : ""}`}
      title={isLocked ? "Khung giờ đã ghim (Bấm để bỏ ghim)" : "Ghim khung giờ cố định"}
    >
      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
    </button>
  );
}
