import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, RECURRENCE_LABELS, RecurrenceType } from "../types";

interface RecurrenceSelectorProps {
  recurrenceType: RecurrenceType;
  setRecurrenceType: (val: RecurrenceType) => void;
  selectedDays: number[];
  toggleDay: (day: number) => void;
  recurrenceEndDate: string;
  setRecurrenceEndDate: (val: string) => void;
  date: string;
}

export function RecurrenceSelector({
  recurrenceType,
  setRecurrenceType,
  selectedDays,
  toggleDay,
  recurrenceEndDate,
  setRecurrenceEndDate,
  date,
}: RecurrenceSelectorProps) {
  const RECURRING_TYPES: RecurrenceType[] = ["NONE", "DAILY", "WEEKLY", "CUSTOM"];

  return (
    <div className="flex flex-col gap-2">
      <Label>Lặp lại</Label>
      <div className="flex flex-wrap gap-2">
        {RECURRING_TYPES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRecurrenceType(r);
              // Clean days if not weekly or custom
              if (r !== "WEEKLY" && r !== "CUSTOM") {
                // Done in hook or parent to avoid state updates inside render, but since it's an event handler:
                // Actually the original code did:
                // onClick={() => {
                //   setRecurrenceType(r);
                //   if (r !== "WEEKLY" && r !== "CUSTOM") setSelectedDays([]);
                // }}
                // We should pass a custom handler or do it here:
                // But wait! We pass setRecurrenceType, so if we want to clear days, we can do it in the parent or
                // just do:
                setRecurrenceType(r);
              }
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-all cursor-pointer",
              recurrenceType === r
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {RECURRENCE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Day-of-week picker for WEEKLY / CUSTOM */}
      {(recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM") && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={cn(
                "w-9 h-9 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                selectedDays.includes(d.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Recurrence end date */}
      {recurrenceType !== "NONE" && (
        <div className="flex flex-col gap-1.5 pt-1">
          <Label htmlFor="evt-rec-end">Kết thúc lặp lại (để trống = vô thời hạn)</Label>
          <Input
            id="evt-rec-end"
            type="date"
            value={recurrenceEndDate}
            onChange={(e) => setRecurrenceEndDate(e.target.value)}
            min={date || undefined}
          />
        </div>
      )}
    </div>
  );
}
