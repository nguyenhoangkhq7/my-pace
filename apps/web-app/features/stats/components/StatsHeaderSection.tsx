import { StatsTitle } from "./StatsTitle";
import { DateNavigator } from "./DateNavigator";
import { RangeTabs } from "./RangeTabs";

interface StatsHeaderSectionProps {
  range: "week" | "month" | "year";
  setRange: (val: "week" | "month" | "year") => void;
  start: Date;
  end: Date;
  onPrev: () => void;
  onNext: () => void;
  streak?: number;
}

export function StatsHeaderSection({
  range,
  setRange,
  start,
  end,
  onPrev,
  onNext,
  streak = 0,
}: StatsHeaderSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <StatsTitle streak={streak} />

      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1.5 shadow-md">
        <DateNavigator
          start={start}
          end={end}
          range={range}
          onPrev={onPrev}
          onNext={onNext}
        />
        <RangeTabs range={range} setRange={setRange} />
      </div>
    </div>
  );
}

