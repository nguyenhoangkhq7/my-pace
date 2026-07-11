import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface TaskFormDurationProps {
  value: string;
  onChange: (val: string) => void;
  requireDuration?: boolean;
}

export function TaskFormDuration({ value, onChange, requireDuration }: TaskFormDurationProps) {
  const { t } = useTranslation();
  const durationInputRef = useRef<HTMLInputElement>(null);
  const presets = [30, 45, 60, 120, 180];
  const isCustom = !presets.includes(Number(value)) && value !== "";

  return (
    <div className="grid gap-2">
      <Label htmlFor="duration">{t.taskForm.durationLabel} {requireDuration && "*"}</Label>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(mins => {
          const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
          const isSelected = value === String(mins);
          return (
            <Button
              key={mins}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-8 px-2.5 text-xs flex-1 min-w-[50px]",
                isSelected ? "bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
              )}
              onClick={() => onChange(String(mins))}
            >
              {label}
            </Button>
          );
        })}
        <Button
          type="button"
          variant={isCustom ? "default" : "outline"}
          className={cn(
            "h-8 px-2.5 text-xs flex-1 min-w-[65px]",
            isCustom 
              ? "bg-primary text-primary-foreground" 
              : "border-border bg-card text-foreground hover:bg-muted"
          )}
          onClick={() => {
            durationInputRef.current?.focus();
            durationInputRef.current?.select();
          }}
        >
          {t.taskForm.customDuration}
        </Button>
      </div>
      <Input
        ref={durationInputRef}
        id="duration"
        type="number"
        min="1"
        placeholder={t.taskForm.customDurationPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="bg-card border-border focus:border-primary h-9 mt-1"
      />
    </div>
  );
}
