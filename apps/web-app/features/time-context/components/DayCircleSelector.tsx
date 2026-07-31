import { useTranslation } from "@/hooks/use-translation";
import type { DayOfWeek } from "../types";

const DAYS: { key: DayOfWeek; num: number }[] = [
  { key: "MONDAY", num: 1 },
  { key: "TUESDAY", num: 2 },
  { key: "WEDNESDAY", num: 3 },
  { key: "THURSDAY", num: 4 },
  { key: "FRIDAY", num: 5 },
  { key: "SATURDAY", num: 6 },
  { key: "SUNDAY", num: 7 },
];

interface DayCircleSelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

export function DayCircleSelector({ selectedDays, onChange }: DayCircleSelectorProps) {
  const { t } = useTranslation();

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex gap-2 items-center justify-between">
      {DAYS.map((day) => {
        const isSelected = selectedDays.includes(day.key);
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => toggleDay(day.key)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all cursor-pointer border ${
              isSelected
                ? "bg-teal-500/10 text-teal-400 border-teal-500/60 ring-2 ring-teal-500/20 shadow-xs"
                : "bg-transparent text-muted-foreground/60 border-border/80 hover:border-foreground/30 hover:bg-muted"
            }`}
          >
            {t.timeContext.days[day.key]}
          </button>
        );
      })}
    </div>
  );
}
