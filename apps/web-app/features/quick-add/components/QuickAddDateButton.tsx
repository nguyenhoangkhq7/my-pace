"use client";

import { useState } from "react";
import { format, isToday, isTomorrow, addDays, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddDateButtonProps {
  dueDate: Date | null;
  onChange: (date: Date | null) => void;
  dueTime: string;
  onTimeChange: (time: string) => void;
}

const QUICK_TIMES = ["09:00", "12:00", "18:00", "23:59"];

const isValidDate = (d: unknown): d is Date => {
  return d instanceof Date && !isNaN(d.getTime());
};

export function QuickAddDateButton({ dueDate, onChange, dueTime, onTimeChange }: QuickAddDateButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const hasValidDate = isValidDate(dueDate);

  const getLabel = () => {
    if (!hasValidDate || !dueDate) return t.sunsamaForm.noDueDate;
    try {
      const timeSuffix = dueTime && dueTime !== "23:59" ? ` ${dueTime}` : "";
      if (isToday(dueDate)) return `${t.sunsamaForm.today}${timeSuffix}`;
      if (isTomorrow(dueDate)) return `${t.sunsamaForm.tomorrow}${timeSuffix}`;
      return `${format(dueDate, "dd/MM")}${timeSuffix}`;
    } catch {
      return t.sunsamaForm.noDueDate;
    }
  };

  const handleSelectPreset = (date: Date | null) => {
    onChange(date);
    if (!date) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            hasValidDate
              ? "bg-muted/60 text-foreground border-border/80 hover:bg-muted"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
          <span>{getLabel()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2.5 space-y-2.5 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        {/* Presets */}
        <div className="grid grid-cols-2 gap-1 pb-1 border-b border-border/50 text-xs">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-7 text-xs font-normal"
            onClick={() => handleSelectPreset(new Date())}
          >
            {t.sunsamaForm.today}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-7 text-xs font-normal"
            onClick={() => handleSelectPreset(addDays(new Date(), 1))}
          >
            {t.sunsamaForm.tomorrow}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-7 text-xs font-normal"
            onClick={() => handleSelectPreset(addDays(startOfWeek(addDays(new Date(), 7)), 1))}
          >
            {t.sunsamaForm.nextWeek}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start h-7 text-xs font-normal text-muted-foreground hover:text-destructive"
            onClick={() => handleSelectPreset(null)}
          >
            {t.sunsamaForm.noDueDate}
          </Button>
        </div>

        {/* Calendar Picker */}
        <Calendar
          mode="single"
          selected={hasValidDate && dueDate ? dueDate : undefined}
          onSelect={(date) => {
            onChange(date || null);
          }}
          className="text-foreground p-0"
        />

        {/* Specific Time Picker Row */}
        {hasValidDate && (
          <div className="pt-2 border-t border-border/50 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>{t.sunsamaForm.dueTimeLabel}</span>
              </div>
              <div className="w-[105px]">
                <TimeSelect
                  value={dueTime || "23:59"}
                  onChange={onTimeChange}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-1">
              {QUICK_TIMES.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => onTimeChange(qt)}
                  className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors border ${
                    dueTime === qt
                      ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                      : "text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {qt === "23:59" ? t.sunsamaForm.endOfDay : qt}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
