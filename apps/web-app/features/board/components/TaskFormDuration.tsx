import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TaskFormDurationProps {
  value: string;
  onChange: (val: string) => void;
  requireDuration?: boolean;
}

export function TaskFormDuration({ value, onChange, requireDuration }: TaskFormDurationProps) {
  const durationInputRef = useRef<HTMLInputElement>(null);
  const presets = [30, 45, 60, 120, 180];
  const isCustom = !presets.includes(Number(value)) && value !== "";

  return (
    <div className="grid gap-2">
      <Label htmlFor="duration">Thời gian thực hiện (phút) {requireDuration && "*"}</Label>
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
                isSelected ? "bg-primary text-white" : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="bg-slate-900 border-slate-800 focus:border-primary h-9 mt-1"
      />
    </div>
  );
}
