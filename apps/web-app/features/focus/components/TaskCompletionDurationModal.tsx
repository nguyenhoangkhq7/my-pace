import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFocusStore } from "../store/focus.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import { shiftTimeBlocks } from "@/features/board/utils/timeShift";
import { useAuthStore } from "@/features/auth";
import { getTodayStr } from "@/lib/date";
import type { TaskTimeBlock, DailyPlan } from "@/features/board/types";
import { useTaskTimeBlocks } from "@/features/board/hooks/useTaskTimeBlocks";
import { createTimeLog } from "../services/timelog-service";

export function TaskCompletionDurationModal() {
  const promptTask = useFocusStore((s) => s.promptTask);
  const setPromptTask = useFocusStore((s) => s.setPromptTask);
  const queryClient = useQueryClient();
  
  const user = useAuthStore((s) => s.user);
  const todayStr = getTodayStr(user?.timezone);
  const { data: timeBlocks = [] } = useTaskTimeBlocks(todayStr, todayStr);



  const saveTimeBlocksMutation = useMutation({
    mutationFn: (blocks: Omit<TaskTimeBlock, 'id'>[]) => fetchClient.post<TaskTimeBlock[]>('time-blocks/batch', { targetDate: todayStr, blocks }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeBlocks'] });
    }
  });

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!promptTask) return null;

  // Calculate the fast, slow, and base values
  const baseVal = promptTask.estimatedMinutes && promptTask.estimatedMinutes > 0 ? promptTask.estimatedMinutes : 25;
  
  let fastVal = Math.round((baseVal * 0.7) / 5) * 5;
  if (fastVal < 5) fastVal = 5;
  if (fastVal === baseVal && baseVal >= 10) fastVal = baseVal - 5;

  let slowVal = Math.round((baseVal * 1.3) / 5) * 5;
  if (slowVal === baseVal) slowVal = baseVal + 5;

  const handleSaveDuration = async (minutes: number) => {
    setIsSaving(true);
    try {
      const dailyPlan = queryClient.getQueryData<DailyPlan>(['dailyPlan', todayStr]);
      const taskInPlan = dailyPlan?.tasks.find(t => t.task.id === promptTask.id);
      const currentActualMinutes = taskInPlan?.task.actualMinutes || 0;
      
      const delta = minutes - currentActualMinutes;
      
      if (delta > 0) {
        const endedAt = new Date();
        const startedAt = new Date(endedAt.getTime() - delta * 60000);
        
        await createTimeLog({
          taskId: promptTask.id,
          loggedMinutes: delta,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
        });
      }

      if (timeBlocks && timeBlocks.length > 0) {
        const estimated = promptTask.estimatedMinutes || 0;
        const shifted = shiftTimeBlocks(timeBlocks, promptTask.id, minutes, estimated);
        await saveTimeBlocksMutation.mutateAsync(shifted);
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
      queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
      
      setPromptTask(null);
      setIsCustom(false);
      setCustomValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleSaveDuration(parsed);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setPromptTask(null)}>
      <DialogContent className="bg-card text-card-foreground border-border sm:max-w-[420px] p-6 rounded-2xl shadow-2xl flex flex-col gap-5">
        <DialogHeader className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl text-emerald-400">🎉</div>
            <DialogTitle className="text-lg font-bold">Hoàn thành xuất sắc!</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm pt-2 leading-relaxed">
            Bạn mất khoảng <strong className="text-foreground font-bold">{baseVal} phút</strong> như dự kiến chứ? Chọn khoảng thời gian thực tế để lưu thống kê chính xác:
          </DialogDescription>
        </DialogHeader>

        {!isCustom ? (
          <div className="flex flex-col gap-2.5">
            <Button
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 rounded-xl cursor-pointer"
              onClick={() => handleSaveDuration(baseVal)}
            >
              Chuẩn luôn ({baseVal} phút)
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={isSaving}
                className="border-border bg-muted/60 hover:bg-muted text-foreground h-9 rounded-xl text-xs cursor-pointer"
                onClick={() => handleSaveDuration(fastVal)}
              >
                Nhanh hơn ({fastVal} phút)
              </Button>
              <Button
                variant="outline"
                disabled={isSaving}
                className="border-border bg-muted/60 hover:bg-muted text-foreground h-9 rounded-xl text-xs cursor-pointer"
                onClick={() => handleSaveDuration(slowVal)}
              >
                Chậm hơn ({slowVal} phút)
              </Button>
            </div>
            <Button
              variant="ghost"
              disabled={isSaving}
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-xs h-9 rounded-xl cursor-pointer"
              onClick={() => setIsCustom(true)}
            >
              Tùy chỉnh thời gian...
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-minutes" className="text-xs text-muted-foreground">Nhập thời gian thực tế (phút):</Label>
              <Input
                id="custom-minutes"
                type="number"
                min="1"
                placeholder="Ví dụ: 30"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="bg-muted/60 border-border text-foreground h-10 rounded-xl"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 rounded-xl text-xs cursor-pointer"
                onClick={() => setIsCustom(false)}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !customValue}
                className="bg-primary text-white font-semibold h-9 px-4 rounded-xl text-xs cursor-pointer"
              >
                Lưu kết quả
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
