import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";
import { TimeSelect } from "@/components/ui/time-select";

export function GoalDateRangeFields() {
  const { register } = useFormContext();
  const { locale } = useLanguageStore();
  const isVi = locale === "vi";

  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      <label className="text-sm font-medium">
        {isVi ? "Thiết lập ngày (Tùy chọn)" : "Set date range (Optional)"}
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground">{isVi ? "Ngày bắt đầu" : "Start date"}</label>
          <Input type="date" min={new Date().toISOString().split('T')[0]} {...register("startDate")} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-muted-foreground">{isVi ? "Ngày kết thúc" : "End date"}</label>
          <Input type="date" min={new Date().toISOString().split('T')[0]} {...register("endDate")} className="h-9 text-sm" />
        </div>
      </div>
    </div>
  );
}

export function HabitGoalFields() {
  const { register, control, setValue } = useFormContext();
  const { t } = useTranslation();
  const { locale } = useLanguageStore();
  const isVi = locale === "vi";
  
  const daysOfWeekValue = useWatch({ control, name: "daysOfWeek" }) || "1,2,3,4,5,6,7";
  const preferTimeValue = useWatch({ control, name: "preferTime" }) || "";
  
  const toggleDay = (day: number) => {
    const current = daysOfWeekValue.split(',').filter(Boolean).map(Number);
    let next;
    if (current.includes(day)) {
      next = current.filter((d: number) => d !== day);
      if (next.length === 0) next = [day]; // Prevent empty
    } else {
      next = [...current, day].sort((a: number, b: number) => a - b);
    }
    setValue("daysOfWeek", next.join(','));
  };

  const days = [
    { label: isVi ? "T2" : "M", value: 1 },
    { label: isVi ? "T3" : "T", value: 2 },
    { label: isVi ? "T4" : "W", value: 3 },
    { label: isVi ? "T5" : "T", value: 4 },
    { label: isVi ? "T6" : "F", value: 5 },
    { label: isVi ? "T7" : "S", value: 6 },
    { label: isVi ? "CN" : "S", value: 7 },
  ];

  const selectedDays = daysOfWeekValue.split(',').filter(Boolean).map(Number);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center justify-between">
            {t.goals.preferTimeLabel} 
            {preferTimeValue ? (
              <button
                type="button"
                onClick={() => setValue("preferTime", "")}
                className="text-[10px] text-rose-500 hover:underline"
              >
                {isVi ? "Xoá" : "Clear"}
              </button>
            ) : (
              <span className="text-muted-foreground text-[11px] font-normal">{t.goals.preferTimeHint}</span>
            )}
          </label>
          <TimeSelect 
            value={preferTimeValue} 
            onChange={(val) => setValue("preferTime", val)} 
          />
        </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.goals.daysOfWeekLabel}</label>
        <div className="flex gap-1.5">
          {days.map((day) => {
            const isSelected = selectedDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer border ${isSelected ? 'bg-teal-500/10 text-teal-500 border-teal-500/50 font-semibold shadow-sm' : 'bg-transparent text-muted-foreground/60 border-border hover:bg-muted'}`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
        <input type="hidden" {...register("daysOfWeek")} />
      </div>
      
      <div className="pt-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoCreateTask"
            {...register("autoCreateTask")}
            className="w-3.5 h-3.5 rounded border-border bg-background accent-teal-500 cursor-pointer"
          />
          <label htmlFor="autoCreateTask" className="text-[12px] text-muted-foreground font-medium cursor-pointer flex items-center gap-1.5">
            {t.goals.autoCreateLabel}
            <span 
              className="flex items-center justify-center w-3 h-3 rounded-full bg-muted text-[8px] text-muted-foreground cursor-help hover:bg-muted-foreground hover:text-background transition-colors"
              title={isVi ? "Hệ thống sẽ tự tạo Task thói quen hàng ngày dựa vào ngày thực hiện mà bạn đã chọn." : "The system will automatically create a daily habit task based on your Days of Week settings."}
            >
              ?
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
