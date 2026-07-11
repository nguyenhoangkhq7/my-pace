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
  parentGoalId?: string;
  startDate: string;
  endDate: string;
  autoCreateTask: boolean;
  defaultSessionMinutes?: number;
  timeBoxedGoal: {
    targetMinutes: number;
    periodDays: number;
  };
  milestoneGoal: {
    targetCount: number;
  };
}

interface GoalFormTypeSelectProps {
  control: Control<FormValues>;
  disabled?: boolean;
}

export function GoalFormTypeSelect({ control, disabled }: GoalFormTypeSelectProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t.goals.typeLabel}</label>
      <Controller
        name="goalType"
        control={control}
        render={({ field }) => (
          <>
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger className="bg-card border-border text-foreground">
                <SelectValue placeholder={t.goals.typeSelectPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="Binary">{t.goals.project}</SelectItem>
                <SelectItem value="Time-boxed">{t.goals.habit}</SelectItem>
                <SelectItem value="Milestone">{t.goals.target}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1 h-8">
              {field.value === 'Binary' && t.goals.descriptionBinary}
              {field.value === 'Time-boxed' && t.goals.descriptionTimeBoxed}
              {field.value === 'Milestone' && t.goals.descriptionMilestone}
            </p>
          </>
        )}
      />
    </div>
  );
}
