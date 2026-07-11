import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { GoalType } from "../types";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguageStore } from "@/features/settings/store/useLanguageStore";

export function ProjectGoalFields() {
  const { register } = useFormContext();
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.goals.startDate}</label>
        <Input type="date" {...register("startDate")} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.goals.endDate}</label>
        <Input type="date" {...register("endDate")} />
      </div>
    </div>
  );
}

export function HabitGoalFields() {
  const { register } = useFormContext();
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/20 pl-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.goals.targetLabel}</label>
        <Input type="number" {...register("timeBoxedGoal.targetMinutes")} min="1" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.goals.periodLabel}</label>
        <Input type="number" {...register("timeBoxedGoal.periodDays")} min="1" />
      </div>
    </div>
  );
}

export function TargetGoalFields() {
  const { register } = useFormContext();
  const { t } = useTranslation();
  return (
    <div className="space-y-2 border-l-2 border-primary/20 pl-4 py-2">
      <label className="text-sm font-medium">{t.goals.targetCountLabel}</label>
      <Input type="number" {...register("milestoneGoal.targetCount")} min="1" />
    </div>
  );
}

function AutoTaskHelpSection({ goalType }: { goalType: GoalType }) {
  const { locale } = useLanguageStore();
  const isVi = locale === "vi";

  if (!isVi) {
    return (
      <div className="p-3 bg-background border border-border/80 rounded-lg text-[11px] text-muted-foreground space-y-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
        <p className="font-semibold text-foreground">💡 How auto-create tasks works at check-in:</p>
        
        {goalType === "Time-boxed" ? (
          <div className="space-y-2">
            <p>The system automatically creates a daily habit task based on the cycle duration. If you have completed enough minutes in the current cycle, it will stop generating tasks.</p>
            <ul className="list-disc pl-3.5 space-y-1 text-muted-foreground/70">
              <li><strong className="text-foreground">Example 1 (Equally Split):</strong> Target <span className="text-primary/95 font-medium">120m / 3 days</span>, session blank: Creates <span className="font-medium text-foreground">40m - 40m - 40m</span>.</li>
              <li><strong className="text-foreground">Example 2 (Pack Sessions):</strong> Target <span className="text-primary/95 font-medium">120m / 3 days</span>, session <span className="font-medium text-foreground">60m</span>: Day 1 creates <span className="font-medium text-foreground">60m</span>, Day 2 creates <span className="font-medium text-foreground">60m</span>, Day 3 creates <span className="font-medium text-foreground">0m</span> (target reached).</li>
              <li><strong className="text-foreground">Example 3 (Auto Fill last session):</strong> Target <span className="text-primary/95 font-medium">120m / 3 days</span>, session <span className="font-medium text-foreground">30m</span>: Day 1 creates <span className="font-medium text-foreground">30m</span>, Day 2 creates <span className="font-medium text-foreground">30m</span>. Day 3 (last day) auto-adjusts to <span className="font-medium text-foreground">60m</span> (120 - 30 - 30) to fulfill the target.</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-1">
            <p>The system will automatically create 1 task daily with a fixed duration you set until you accumulate enough items for the Target.</p>
            <p className="text-muted-foreground/70"><strong className="text-foreground">Example:</strong> Target 10 exercises, session duration 45 mins. Every day the system generates a 45m task until 10 items are completed.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-background border border-border/80 rounded-lg text-[11px] text-muted-foreground space-y-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
      <p className="font-semibold text-foreground">💡 Cơ chế tự động tạo Task khi Check-in:</p>
      
      {goalType === "Time-boxed" ? (
        <div className="space-y-2">
          <p>Hệ thống tự tạo Task thói quen hàng ngày dựa vào thời lượng chu kỳ. Nếu bạn đã hoàn thành đủ số phút trong chu kỳ hiện tại, hệ thống sẽ dừng sinh Task.</p>
          <ul className="list-disc pl-3.5 space-y-1 text-muted-foreground/70">
            <li><strong className="text-foreground">Ví dụ 1 (Chia đều):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, bỏ trống thời lượng phiên: Tạo <span className="font-medium text-foreground">40m - 40m - 40m</span>.</li>
            <li><strong className="text-foreground">Ví dụ 2 (Dồn phiên):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, chọn phiên <span className="font-medium text-foreground">60 phút</span>: Ngày 1 tạo <span className="font-medium text-foreground">60m</span>, Ngày 2 tạo <span className="font-medium text-foreground">60m</span>, Ngày 3 tạo <span className="font-medium text-foreground">0m</span> (đã đạt).</li>
            <li><strong className="text-foreground">Ví dụ 3 (Tự bù phiên cuối):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, chọn phiên <span className="font-medium text-foreground">30 phút</span>: Ngày 1 tạo <span className="font-medium text-foreground">30m</span>, Ngày 2 tạo <span className="font-medium text-foreground">30m</span>. Ngày 3 (ngày cuối) tự động chuyển thành <span className="font-medium text-foreground">60m</span> (120 - 30 - 30) để hoàn thành đủ chu kỳ.</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-1">
          <p>Hệ thống sẽ tự tạo 1 Task mỗi ngày với thời lượng cố định do bạn thiết lập cho đến khi tích lũy đạt đủ số lượng của Mục tiêu (Target).</p>
          <p className="text-muted-foreground/70"><strong className="text-foreground">Ví dụ:</strong> Target 10 bài tập, thời lượng phiên là 45 phút. Mỗi ngày hệ thống sinh 1 task 45 phút cho tới khi hoàn thành đủ 10 bài.</p>
        </div>
      )}
    </div>
  );
}

export function AutoTaskFields({ goalType }: { goalType: GoalType }) {
  const { register, control } = useFormContext();
  const { t } = useTranslation();
  const [showAutoTaskHelp, setShowAutoTaskHelp] = useState(false);
  const autoCreateTask = useWatch({ control, name: "autoCreateTask" });

  return (
    <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoCreateTask"
            {...register("autoCreateTask")}
            className="w-4 h-4 rounded border-border bg-background accent-primary cursor-pointer"
          />
          <label htmlFor="autoCreateTask" className="text-sm font-medium cursor-pointer">
            {t.goals.autoCreateLabel}
          </label>
        </div>
        
        <button
          type="button"
          onClick={() => setShowAutoTaskHelp(!showAutoTaskHelp)}
          className="w-4 h-4 rounded-full bg-card hover:bg-muted text-[10px] text-muted-foreground font-semibold flex items-center justify-center border border-border transition-colors cursor-pointer shrink-0"
          title={t.goals.autoCreateLabel}
        >
          ?
        </button>
      </div>

      {showAutoTaskHelp && (
        <AutoTaskHelpSection goalType={goalType} />
      )}

      {autoCreateTask && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium block">
            {goalType === "Time-boxed" 
              ? t.goals.defaultSessionLabel
              : t.goals.defaultSessionLabelMilestone}
          </label>
          <Input 
            type="number" 
            {...register("defaultSessionMinutes")} 
            placeholder={goalType === "Time-boxed" ? "Ví dụ: 60" : "Ví dụ: 45"} 
            min="1" 
          />
        </div>
      )}
    </div>
  );
}
