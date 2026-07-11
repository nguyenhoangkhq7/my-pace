import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DAYS_OF_WEEK, RecurrenceType } from "../types";
import { RecurrenceTypeOption } from "./RecurrenceTypeOption";
import { DayOfWeekOption } from "./DayOfWeekOption";

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
          <RecurrenceTypeOption
            key={r}
            value={r}
            isSelected={recurrenceType === r}
            onClick={() => setRecurrenceType(r)}
          />
        ))}
      </div>

      {/* Day-of-week picker for WEEKLY / CUSTOM */}
      {(recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM") && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DAYS_OF_WEEK.map((d) => (
            <DayOfWeekOption
              key={d.value}
              label={d.label}
              isSelected={selectedDays.includes(d.value)}
              onClick={() => toggleDay(d.value)}
            />
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
