import { useId } from "react";
import { UseFormReturn, Controller, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpSquareIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";
import { TaskFormValues } from "../schema/task.schema";

interface TaskFormSplittableProps {
  form: UseFormReturn<TaskFormValues>;
}

const MIN_CHUNK_PRESETS = [
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "60m", value: 60 },
  { label: "90m", value: 90 },
  { label: "120m", value: 120 },
];

export function TaskFormSplittable({ form }: TaskFormSplittableProps) {
  const splittableId = useId();
  const { t } = useTranslation();
  const { control, setValue, trigger, formState: { errors } } = form;

  const isSplittable = useWatch({ control, name: "isSplittable" });
  const minChunk = useWatch({ control, name: "minChunkMinutes" });
  const maxDaily = useWatch({ control, name: "maxDailyDuration" });
  const estimatedMinutes = useWatch({ control, name: "estimatedMinutes" });

  const maxDailyPresets = [
    { label: "2h", value: 120 },
    { label: "3h", value: 180 },
    { label: "4h", value: 240 },
    { label: "6h", value: 360 },
    { label: t.taskForm.unlimited, value: null },
  ];

  const updateMinChunk = (val: number | null) => {
    setValue("minChunkMinutes", val, { shouldDirty: true });
    trigger(["estimatedMinutes", "minChunkMinutes", "maxDailyDuration"]);
  };

  const updateMaxDaily = (val: number | null) => {
    setValue("maxDailyDuration", val, { shouldDirty: true });
    trigger(["estimatedMinutes", "minChunkMinutes", "maxDailyDuration"]);
  };

  const handleToggle = () => {
    const nextVal = !isSplittable;
    setValue("isSplittable", nextVal, { shouldDirty: true });

    if (nextVal && (!minChunk || minChunk < 15)) {
      const est = estimatedMinutes ? Number(estimatedMinutes) : 30;
      const defaultMinChunk = est >= 30 ? 30 : Math.max(15, est);
      setValue("minChunkMinutes", defaultMinChunk, { shouldDirty: true });
    }

    trigger(["estimatedMinutes", "minChunkMinutes", "maxDailyDuration"]);
  };

  return (
    <div className="space-y-3 pt-4 border-t border-border/50">
      <div 
        className="flex items-center space-x-2 cursor-pointer select-none w-fit"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-slot="tooltip-trigger"]')) return;
          handleToggle();
        }}
      >
        <Controller
          name="isSplittable"
          control={control}
          render={({ field }) => (
            <Checkbox
              id={splittableId}
              checked={!!field.value}
              onCheckedChange={handleToggle}
              className="border-border pointer-events-none"
            />
          )}
        />
        <Label
          htmlFor={splittableId}
          className="cursor-pointer font-normal text-sm pointer-events-none"
        >
          {t.taskForm.splittableLabel}
        </Label>
        
        {/* Simplified Tooltip without Provider */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              type="button" 
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={HelpSquareIcon} className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {t.taskForm.splittableTooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {!!isSplittable && (
        <div className="pl-6 space-y-4 pt-1">
          {/* Min Chunk Minutes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t.taskForm.minChunkLabel}
            </Label>
            <div className="flex items-start gap-2">
              <Input
                type="number"
                placeholder={t.taskForm.minChunkPlaceholder}
                value={minChunk ?? ""}
                onChange={(e) =>
                  updateMinChunk(e.target.value ? Number(e.target.value) : null)
                }
                className="w-32 h-8 text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {MIN_CHUNK_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateMinChunk(preset.value)}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      minChunk === preset.value
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-muted/50 hover:bg-muted border-border"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            {errors.minChunkMinutes?.message && (
              <p className="text-xs text-destructive">{String(errors.minChunkMinutes.message)}</p>
            )}
          </div>

          {/* Max Daily Duration */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t.taskForm.maxDailyLabel}
            </Label>
            <div className="flex items-start gap-2">
              <Input
                type="number"
                placeholder={t.taskForm.maxDailyPlaceholder}
                value={maxDaily ?? ""}
                onChange={(e) =>
                  updateMaxDaily(e.target.value ? Number(e.target.value) : null)
                }
                className="w-32 h-8 text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {maxDailyPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => updateMaxDaily(preset.value)}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      maxDaily === preset.value
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-muted/50 hover:bg-muted border-border"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            {errors.maxDailyDuration?.message && (
              <p className="text-xs text-destructive">{String(errors.maxDailyDuration.message)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
