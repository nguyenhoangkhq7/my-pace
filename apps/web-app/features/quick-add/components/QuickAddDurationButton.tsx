"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddDurationButtonProps {
  estimatedMinutes: number | null;
  onChange: (minutes: number | null) => void;
}

const PRESETS = [
  { label: "15p", value: 15 },
  { label: "30p", value: 30 },
  { label: "45p", value: 45 },
  { label: "1h", value: 60 },
  { label: "1h30", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h", value: 180 },
  { label: "4h", value: 240 },
];

export function QuickAddDurationButton({ estimatedMinutes, onChange }: QuickAddDurationButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");

  const formatLabel = (mins: number | null) => {
    if (!mins) return "--:--";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const handleSelect = (mins: number | null) => {
    onChange(mins);
    setOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleSelect(parsed);
      setCustomVal("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t.sunsamaForm.estimatedDuration}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            estimatedMinutes
              ? "bg-muted/60 text-foreground border-border/80 hover:bg-muted"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5 opacity-70" />
          <span>{formatLabel(estimatedMinutes)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 space-y-2 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {t.sunsamaForm.estimatedDuration}
        </p>
        <div className="grid grid-cols-4 gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={estimatedMinutes === p.value ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-1"
              onClick={() => handleSelect(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <form onSubmit={handleCustomSubmit} className="flex gap-1 pt-1 border-t border-border/50">
          <Input
            type="number"
            min={1}
            max={720}
            placeholder={t.sunsamaForm.minutesPlaceholder}
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            className="h-7 text-xs bg-muted/30"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-7 text-xs">
            {t.sunsamaForm.setBtn}
          </Button>
        </form>
        {estimatedMinutes && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-6 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => handleSelect(null)}
          >
            {t.sunsamaForm.clearDuration}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
