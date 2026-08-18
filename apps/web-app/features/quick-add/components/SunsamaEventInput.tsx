"use client";

import { useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClient, getApiErrorMessage } from "@/lib/fetchClient";
import { useAutoSchedule } from "@/features/board/hooks/useAutoSchedule";
import { QuickAddDateButton } from "./QuickAddDateButton";
import { QuickAddEventTimeButton } from "./QuickAddEventTimeButton";
import { QuickAddCategoryButton } from "./QuickAddCategoryButton";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import type { CreateEventPayload } from "@/features/calendar/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { X } from "lucide-react";

function formatRecurrenceLabel(recurrenceType: string, days?: number[]): string {
  if (recurrenceType === "DAILY") return "Lặp hàng ngày";
  if (recurrenceType === "WEEKLY") {
    if (!days || days.length === 0) return "Lặp hàng tuần";
    const dayNames: Record<number, string> = {
      1: "T2",
      2: "T3",
      3: "T4",
      4: "T5",
      5: "T6",
      6: "T7",
      7: "CN",
    };
    return `Lặp: ${days.map((d) => dayNames[d] || `T${d}`).join(", ")}`;
  }
  return "Định kỳ";
}

interface SunsamaEventInputProps {
  initialTitle?: string;
  initialNotes?: string;
  initialEventDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  initialIsAllDay?: boolean;
  initialCategoryId?: string;
  initialRecurrenceType?: string;
  initialRecurrenceDaysOfWeek?: number[];
  initialRecurrenceEndDate?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export function SunsamaEventInput({
  initialTitle = "",
  initialNotes = "",
  initialEventDate = new Date(),
  initialStartTime = "09:00",
  initialEndTime = "10:00",
  initialIsAllDay = false,
  initialCategoryId,
  initialRecurrenceType = "NONE",
  initialRecurrenceDaysOfWeek,
  initialRecurrenceEndDate,
  onSuccess,
  onCancel,
  autoFocus = true,
  placeholder,
  className,
}: SunsamaEventInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { triggerAutoSchedule } = useAutoSchedule();

  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const [showNotes, setShowNotes] = useState(Boolean(initialNotes));
  const [eventDate, setEventDate] = useState<Date | null>(initialEventDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [isAllDay, setIsAllDay] = useState(initialIsAllDay);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId || null);
  const [recurrenceType, setRecurrenceType] = useState<string>(initialRecurrenceType || "NONE");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(initialRecurrenceDaysOfWeek || []);
  const recurrenceEndDate = initialRecurrenceEndDate || "";
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isLoading) return;

    setIsLoading(true);

    try {
      const dateStr = eventDate ? format(eventDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      const payload: CreateEventPayload = {
        title: trimmedTitle,
        notes: notes.trim() || undefined,
        startTime: isAllDay ? undefined : `${startTime}:00`,
        endTime: isAllDay ? undefined : `${endTime}:00`,
        eventDate: dateStr,
        isAllDay,
        recurrenceType: (recurrenceType as CreateEventPayload["recurrenceType"]) || "NONE",
        recurrenceDaysOfWeek: recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : undefined,
        recurrenceEndDate: recurrenceEndDate || undefined,
        categoryId: categoryId || undefined,
      };

      await fetchClient.post("calendar/events", payload);
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["availableTime"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      triggerAutoSchedule();

      toast.success(t.quickAdd.createdEvent || "Sự kiện đã tạo!");
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tạo sự kiện"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel?.();
    }
  };

  const inputPlaceholder = placeholder || "Nhập tên sự kiện...";

  return (
    <div className={cn("p-3.5 space-y-3 bg-card rounded-xl", className)}>
      {/* Title Input */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={inputPlaceholder}
          disabled={isLoading}
          maxLength={300}
          className="w-full bg-transparent border-none outline-none text-base font-medium text-foreground placeholder:text-muted-foreground/60 disabled:opacity-75"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Optional Expandable Notes */}
      {showNotes && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">{t.sunsamaForm.notesLabel || "Ghi chú"}</span>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
            >
              Đóng
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.sunsamaForm.notesPlaceholder || "Thêm ghi chú..."}
            rows={2}
            className="w-full text-xs p-2 rounded-lg bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 resize-y"
          />
        </div>
      )}

      {/* Sunsama Event Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
        {/* Left: Event attribute selectors */}
        <div className="flex flex-wrap items-center gap-1">
          <QuickAddDateButton
            dueDate={eventDate}
            onChange={setEventDate}
            dueTime={startTime}
            onTimeChange={setStartTime}
          />
          <QuickAddEventTimeButton
            startTime={startTime}
            endTime={endTime}
            isAllDay={isAllDay}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onIsAllDayChange={setIsAllDay}
          />
          <QuickAddCategoryButton
            categoryId={categoryId}
            onChange={setCategoryId}
          />
          {recurrenceType && recurrenceType !== "NONE" && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
              <HugeiconsIcon icon={Calendar03Icon} className="h-3 w-3" />
              <span>{formatRecurrenceLabel(recurrenceType, recurrenceDaysOfWeek)}</span>
              <button
                type="button"
                onClick={() => {
                  setRecurrenceType("NONE");
                  setRecurrenceDaysOfWeek([]);
                }}
                className="ml-0.5 hover:text-rose-500 cursor-pointer"
                title="Hủy lặp"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <button
            type="button"
            title={t.sunsamaForm.notesBtn || "Ghi chú"}
            onClick={() => setShowNotes((v) => !v)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
              showNotes || notes.trim()
                ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            {t.sunsamaForm.notesBtn || "Ghi chú"}
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t.sunsamaForm.cancel || "Hủy"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!title.trim() || isLoading}
            className="h-7 text-xs px-3 font-medium cursor-pointer"
          >
            {isLoading
              ? (t.quickAdd.creating || "Đang tạo...")
              : (`Tạo ${t.quickAdd.typeEvent || "Sự kiện"}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
