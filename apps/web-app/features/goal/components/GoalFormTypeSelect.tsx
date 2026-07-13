import React from "react";
import { Controller, Control } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoalType } from "../types";
import { useTranslation } from "@/hooks/use-translation";

interface FormValues {
  title: string;
  goalType: GoalType;
  status: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  autoCreateTask: boolean;
  durationMinutes: number;
  daysOfWeek: string;
  preferTime: string;

}

interface GoalFormTypeSelectProps {
  control: Control<FormValues>;
  disabled?: boolean;
}

export function GoalFormTypeSelect({ control, disabled }: GoalFormTypeSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      <Controller
        name="goalType"
        control={control}
        render={({ field }) => (
          <>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
              {t.goals.typeLabel}
              <span 
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] text-muted-foreground cursor-help hover:bg-muted-foreground hover:text-background transition-colors"
                title={field.value === 'Binary' ? t.goals.descriptionBinary : t.goals.descriptionTimeBoxed}
              >
                ?
              </span>
            </label>
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger className="bg-card border-border text-foreground h-9">
                <SelectValue placeholder={t.goals.typeSelectPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="Binary">{t.goals.project}</SelectItem>
                <SelectItem value="Time-boxed">{t.goals.habit}</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      />
    </div>
  );
}
