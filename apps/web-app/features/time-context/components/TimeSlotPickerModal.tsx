import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";
import { DayCircleSelector } from "./DayCircleSelector";
import type { DayOfWeek, TimeContextSlot } from "../types";

interface TimeSlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlots: (newSlots: TimeContextSlot[]) => void;
}

export function TimeSlotPickerModal({ isOpen, onClose, onAddSlots }: TimeSlotPickerModalProps) {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("22:00");
  const [error, setError] = useState("");

  const handlePresetWeekdays = () => {
    setSelectedDays(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
  };

  const handlePresetWeekend = () => {
    setSelectedDays(["SATURDAY", "SUNDAY"]);
  };

  const handlePresetEveryday = () => {
    setSelectedDays([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]);
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      setError("Vui lòng chọn ít nhất 1 ngày trong tuần");
      return;
    }

    if (startTime >= endTime) {
      setError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
      return;
    }

    setError("");

    // Create a slot for each selected day
    const generatedSlots: TimeContextSlot[] = selectedDays.map((day) => ({
      dayOfWeek: day,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
    }));

    onAddSlots(generatedSlots);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background text-foreground border-border sm:max-w-[420px] p-6">
        <DialogHeader>
          <DialogTitle>Thêm Khung Giờ</DialogTitle>
        </DialogHeader>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="space-y-5 py-2">
          {/* Day Circle Selector & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Chọn thứ trong tuần
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handlePresetWeekdays}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  T2-T6
                </button>
                <span className="text-[10px] text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={handlePresetWeekend}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  T7-CN
                </button>
                <span className="text-[10px] text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={handlePresetEveryday}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  Hàng ngày
                </button>
              </div>
            </div>

            <DayCircleSelector selectedDays={selectedDays} onChange={setSelectedDays} />
          </div>

          {/* Time Picker Range (Image 2 style) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Khoảng thời gian (Giờ : Phút)
            </label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Từ giờ:</span>
                <TimeSelect value={startTime} onChange={setStartTime} size="md" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Đến giờ:</span>
                <TimeSelect value={endTime} onChange={setEndTime} size="md" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            {t.common.cancel}
          </Button>
          <Button size="sm" onClick={handleSave} className="cursor-pointer">
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
