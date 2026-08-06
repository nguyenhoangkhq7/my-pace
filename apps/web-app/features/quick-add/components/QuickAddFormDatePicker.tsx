"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimeSelect } from "@/components/ui/time-select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddFormDatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  time: string;
  onTimeChange: (time: string) => void;
}

export function QuickAddFormDatePicker({ date, onDateChange, time, onTimeChange }: QuickAddFormDatePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-1.5">
      <Label>{t.taskForm.dueDateLabel}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-card border-border h-9 text-sm",
                  !date && "text-muted-foreground"
                )}
              >
                <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy") : <span>{t.taskForm.pickDate}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                className="text-foreground"
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>
        {date && (
          <>
            <div className="w-[120px]">
              <TimeSelect value={time} onChange={onTimeChange} size="sm" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => { onDateChange(undefined); onTimeChange("23:59"); }}
              className="h-8 w-8 text-muted-foreground hover:text-red-400 cursor-pointer shrink-0"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
