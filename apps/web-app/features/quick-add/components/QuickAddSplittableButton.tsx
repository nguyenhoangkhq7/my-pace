"use client";

import { useState } from "react";
import { Layers, AlertCircle } from "lucide-react";
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
  estimatedMinutes?: number | null;
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
  estimatedMinutes,
}: QuickAddSplittableButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const maxDailyPresets = [
    { label: "2h", value: 120 },
    { label: "4h", value: 240 },
    { label: "6h", value: 360 },
    { label: "8h", value: 480 },
    { label: "12h", value: 720 },
    { label: t.sunsamaForm.unlimited, value: null },
  ];

  const currentMinChunk = minChunkMinutes || 30;
  const isMissingEst = isSplittable && (!estimatedMinutes || estimatedMinutes < 15);
  const isChunkTooBig = isSplittable && !!estimatedMinutes && currentMinChunk > estimatedMinutes;
  const isMaxDailyTooSmall = isSplittable && !!maxDailyDuration && maxDailyDuration < currentMinChunk;
  const hasConflict = isMissingEst || isChunkTooBig || isMaxDailyTooSmall;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={hasConflict ? "Cần điều chỉnh cấu hình chia nhỏ" : t.sunsamaForm.splittableTitle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            hasConflict
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/25"
              : isSplittable
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          {hasConflict ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <Layers className="h-3.5 w-3.5 opacity-80 shrink-0" />
          )}
          {isSplittable && <span className="text-[11px] font-semibold">{t.sunsamaForm.splittableBadge}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-3 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        {/* Real-time inline conflict warnings */}
        {isMissingEst && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 leading-tight">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Thời gian ước tính cần từ 15 phút trở lên để chia nhỏ.</span>
          </div>
        )}
        {isChunkTooBig && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1.5 leading-tight">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Block tối thiểu ({currentMinChunk}p) lớn hơn tổng thời gian ({estimatedMinutes}p).</span>
          </div>
        )}
        {isMaxDailyTooSmall && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1.5 leading-tight">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Thời lượng tối đa 1 ngày ({maxDailyDuration}p) nhỏ hơn 1 block ({currentMinChunk}p).</span>
          </div>
        )}
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
