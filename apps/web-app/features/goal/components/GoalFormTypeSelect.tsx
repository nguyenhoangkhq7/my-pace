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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Type</label>
      <Controller
        name="goalType"
        control={control}
        render={({ field }) => (
          <>
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger className="bg-card border-border text-foreground">
                <SelectValue placeholder="Chọn loại mục tiêu" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="Binary">Project</SelectItem>
                <SelectItem value="Time-boxed">Habit</SelectItem>
                <SelectItem value="Milestone">Target</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1 h-8">
              {field.value === 'Binary' && 'A project with a deadline. Progress is tracked by % of completed tasks.'}
              {field.value === 'Time-boxed' && 'A habit to maintain. Measured by accumulated minutes over a period.'}
              {field.value === 'Milestone' && 'A countable target (e.g. Run 100km, Make 50 calls).'}
            </p>
          </>
        )}
      />
    </div>
  );
}
