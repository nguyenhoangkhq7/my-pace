"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddEventTimeButtonProps {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isAllDay: boolean;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onIsAllDayChange: (allDay: boolean) => void;
}

const DURATION_PRESETS = [
  { label: "30p", mins: 30 },
  { label: "45p", mins: 45 },
  { label: "1h", mins: 60 },
  { label: "1h30", mins: 90 },
  { label: "2h", mins: 120 },
  { label: "3h", mins: 180 },
];

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [h, m] = (timeStr || "09:00").split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  const newH = Math.floor((total % (24 * 60)) / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function QuickAddEventTimeButton({
  startTime,
  endTime,
  isAllDay,
  onStartTimeChange,
  onEndTimeChange,
  onIsAllDayChange,
}: QuickAddEventTimeButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const getLabel = () => {
    if (isAllDay) return t.quickAdd.allDay || "Cả ngày";
    const start = startTime || "09:00";
    const end = endTime || addMinutesToTime(start, 60);
    return `${start} → ${end}`;
  };

  const handleApplyDuration = (mins: number) => {
    const start = startTime || "09:00";
    onEndTimeChange(addMinutesToTime(start, mins));
    if (isAllDay) onIsAllDayChange(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t.quickAdd.startTime}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            startTime || isAllDay
              ? "bg-muted/60 text-foreground border-border/80 hover:bg-muted"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <span>{getLabel()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 space-y-3 bg-popover text-popover-foreground border-border shadow-lg"
        align="start"
      >
        {/* All-day toggle */}
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <span className="text-xs font-medium text-foreground">{t.quickAdd.allDay || "Cả ngày"}</span>
          <button
            type="button"
            onClick={() => onIsAllDayChange(!isAllDay)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              isAllDay
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted/30 text-muted-foreground border-border/40 hover:text-foreground"
            }`}
          >
            {isAllDay ? "Bật" : "Tắt"}
          </button>
        </div>

        {!isAllDay && (
          <>
            {/* Start & End Time selects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground w-14 shrink-0">Bắt đầu:</span>
                <TimeSelect
                  value={startTime || "09:00"}
                  onChange={(val) => {
                    onStartTimeChange(val);
                    onEndTimeChange(addMinutesToTime(val, 60));
                  }}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground w-14 shrink-0">Kết thúc:</span>
                <TimeSelect
                  value={endTime || "10:00"}
                  onChange={onEndTimeChange}
                  size="sm"
                />
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div className="space-y-1 pt-1 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Thời lượng nhanh
              </span>
              <div className="flex flex-wrap gap-1">
                {DURATION_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyDuration(p.mins)}
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
