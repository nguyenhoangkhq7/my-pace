"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddSplittableButtonProps {
  isSplittable: boolean;
  onSplittableChange: (val: boolean) => void;
  minChunkMinutes: number | null;
  onMinChunkChange: (val: number | null) => void;
  maxDailyDuration: number | null;
  onMaxDailyChange: (val: number | null) => void;
}

const MIN_CHUNK_PRESETS = [
  { label: "30p", value: 30 },
  { label: "45p", value: 45 },
  { label: "1h", value: 60 },
  { label: "1h30", value: 90 },
  { label: "2h", value: 120 },
];

export function QuickAddSplittableButton({
  isSplittable,
  onSplittableChange,
  minChunkMinutes,
  onMinChunkChange,
  maxDailyDuration,
  onMaxDailyChange,
}: QuickAddSplittableButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const maxDailyPresets = [
    { label: "2h", value: 120 },
    { label: "3h", value: 180 },
    { label: "4h", value: 240 },
    { label: "6h", value: 360 },
    { label: t.sunsamaForm.unlimited, value: null },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t.sunsamaForm.splittableTitle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            isSplittable
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5 opacity-80" />
          {isSplittable && <span className="text-[11px] font-semibold">{t.sunsamaForm.splittableBadge}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-3 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        {/* Toggle header */}
        <div className="space-y-1 pb-2 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="splittable-toggle"
              checked={isSplittable}
              onCheckedChange={(checked) => onSplittableChange(checked === true)}
              className="border-border"
            />
            <Label
              htmlFor="splittable-toggle"
              className="text-xs font-semibold cursor-pointer select-none"
            >
              {t.sunsamaForm.splittableTitle}
            </Label>
          </div>
          <p className="text-[11px] text-muted-foreground/80 pl-6 leading-tight">
            {t.sunsamaForm.splittableDesc}
          </p>
        </div>

        {isSplittable && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Min chunk */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  {t.sunsamaForm.minChunk}
                </Label>
                <span className="text-[11px] font-semibold text-foreground">
                  {minChunkMinutes ? `${minChunkMinutes}p` : "30p"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {MIN_CHUNK_PRESETS.map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant={minChunkMinutes === p.value ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[11px] px-2.5"
                    onClick={() => onMinChunkChange(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Max daily */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  {t.sunsamaForm.maxDaily}
                </Label>
                <span className="text-[11px] font-semibold text-foreground">
                  {maxDailyDuration ? `${Math.floor(maxDailyDuration / 60)}h` : t.sunsamaForm.unlimited}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {maxDailyPresets.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    variant={maxDailyDuration === p.value ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[11px] px-2.5"
                    onClick={() => onMaxDailyChange(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
