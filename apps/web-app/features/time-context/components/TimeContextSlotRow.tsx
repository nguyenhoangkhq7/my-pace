import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";
import type { DayOfWeek, TimeContextSlot } from "../types";

const DAY_KEYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

interface TimeContextSlotRowProps {
  slot: TimeContextSlot;
  onChange: (updated: TimeContextSlot) => void;
  onRemove: () => void;
}

export function TimeContextSlotRow({ slot, onChange, onRemove }: TimeContextSlotRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border border-border/50 text-xs">
      <select
        value={slot.dayOfWeek}
        onChange={(e) => onChange({ ...slot, dayOfWeek: e.target.value as DayOfWeek })}
        className="bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
      >
        {DAY_KEYS.map((d) => (
          <option key={d} value={d}>
            {t.timeContext.days[d]}
          </option>
        ))}
      </select>

      <div className="w-24 shrink-0">
        <TimeSelect
          size="sm"
          value={slot.startTime ? slot.startTime.substring(0, 5) : "07:00"}
          onChange={(val) => onChange({ ...slot, startTime: `${val}:00` })}
        />
      </div>

      <span className="text-muted-foreground">-</span>

      <div className="w-24 shrink-0">
        <TimeSelect
          size="sm"
          value={slot.endTime ? slot.endTime.substring(0, 5) : "09:00"}
          onChange={(val) => onChange({ ...slot, endTime: `${val}:00` })}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
