import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DurationPickerProps {
  estimatedMinutes: string;
  setEstimatedMinutes: (val: string) => void;
  requireDuration?: boolean;
  durationInputRef: React.RefObject<HTMLInputElement | null>;
}

export function DurationPicker({
  estimatedMinutes,
  setEstimatedMinutes,
  requireDuration,
  durationInputRef,
}: DurationPickerProps) {
  const PRESET_DURATIONS = [30, 45, 60, 120, 180];
  const isCustomDuration =
    ![30, 45, 60, 120, 180].includes(Number(estimatedMinutes)) &&
    estimatedMinutes !== "";

  return (
    <div className="grid gap-2">
      <Label htmlFor="duration">
        Thời gian thực hiện (phút) {requireDuration && "*"}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_DURATIONS.map((mins) => {
          const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
          const isSelected = estimatedMinutes === String(mins);
          return (
            <Button
              key={mins}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-8 px-2.5 text-xs flex-1 min-w-[50px]",
                isSelected
                  ? "bg-primary text-white"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              )}
              onClick={() => setEstimatedMinutes(String(mins))}
            >
              {label}
            </Button>
          );
        })}
        <Button
          type="button"
          variant={isCustomDuration ? "default" : "outline"}
          className={cn(
            "h-8 px-2.5 text-xs flex-1 min-w-[65px]",
            isCustomDuration
              ? "bg-primary text-white"
              : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
          )}
          onClick={() => {
            durationInputRef.current?.focus();
            durationInputRef.current?.select();
          }}
        >
          Tự nhập
        </Button>
      </div>
      <Input
        ref={durationInputRef}
        id="duration"
        type="number"
        min="1"
        placeholder="Hoặc tự nhập số phút..."
        value={estimatedMinutes}
        onChange={(e) => setEstimatedMinutes(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="bg-slate-900 border-slate-800 focus:border-primary h-9 mt-1"
      />
    </div>
  );
}
