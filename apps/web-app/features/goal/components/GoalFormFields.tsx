import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { GoalType } from "../types";

export function ProjectGoalFields() {
  const { register } = useFormContext();
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Ngày bắt đầu</label>
        <Input type="date" {...register("startDate")} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Ngày kết thúc</label>
        <Input type="date" {...register("endDate")} />
      </div>
    </div>
  );
}

export function HabitGoalFields() {
  const { register } = useFormContext();
  return (
    <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/20 pl-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Target (minutes)</label>
        <Input type="number" {...register("timeBoxedGoal.targetMinutes")} min="1" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Period (days)</label>
        <Input type="number" {...register("timeBoxedGoal.periodDays")} min="1" />
      </div>
    </div>
  );
}

export function TargetGoalFields() {
  const { register } = useFormContext();
  return (
    <div className="space-y-2 border-l-2 border-primary/20 pl-4 py-2">
      <label className="text-sm font-medium">Target count</label>
      <Input type="number" {...register("milestoneGoal.targetCount")} min="1" />
    </div>
  );
}

function AutoTaskHelpSection({ goalType }: { goalType: GoalType }) {
  return (
    <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 space-y-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
      <p className="font-semibold text-slate-200">💡 Cơ chế tự động tạo Task khi Check-in:</p>
      
      {goalType === "Time-boxed" ? (
        <div className="space-y-2">
          <p>Hệ thống tự tạo Task thói quen hàng ngày dựa vào thời lượng chu kỳ. Nếu bạn đã hoàn thành đủ số phút trong chu kỳ hiện tại, hệ thống sẽ dừng sinh Task.</p>
          <ul className="list-disc pl-3.5 space-y-1 text-slate-500">
            <li><strong className="text-slate-300">Ví dụ 1 (Chia đều):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, bỏ trống thời lượng phiên: Tạo <span className="font-medium text-slate-300">40m - 40m - 40m</span>.</li>
            <li><strong className="text-slate-300">Ví dụ 2 (Dồn phiên):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, chọn phiên <span className="font-medium text-slate-300">60 phút</span>: Ngày 1 tạo <span className="font-medium text-slate-300">60m</span>, Ngày 2 tạo <span className="font-medium text-slate-300">60m</span>, Ngày 3 tạo <span className="font-medium text-slate-300">0m</span> (đã đạt).</li>
            <li><strong className="text-slate-300">Ví dụ 3 (Tự bù phiên cuối):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, chọn phiên <span className="font-medium text-slate-300">30 phút</span>: Ngày 1 tạo <span className="font-medium text-slate-300">30m</span>, Ngày 2 tạo <span className="font-medium text-slate-300">30m</span>. Ngày 3 (ngày cuối) tự động chuyển thành <span className="font-medium text-slate-300">60m</span> (120 - 30 - 30) để hoàn thành đủ chu kỳ.</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-1">
          <p>Hệ thống sẽ tự tạo 1 Task mỗi ngày với thời lượng cố định do bạn thiết lập cho đến khi tích lũy đạt đủ số lượng của Mục tiêu (Target).</p>
          <p className="text-slate-500"><strong className="text-slate-300">Ví dụ:</strong> Target 10 bài tập, thời lượng phiên là 45 phút. Mỗi ngày hệ thống sinh 1 task 45 phút cho tới khi hoàn thành đủ 10 bài.</p>
        </div>
      )}
    </div>
  );
}

export function AutoTaskFields({ goalType }: { goalType: GoalType }) {
  const { register, control } = useFormContext();
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
            className="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-primary cursor-pointer"
          />
          <label htmlFor="autoCreateTask" className="text-sm font-medium cursor-pointer">
            Tự động tạo Task hàng ngày
          </label>
        </div>
        
        <button
          type="button"
          onClick={() => setShowAutoTaskHelp(!showAutoTaskHelp)}
          className="w-4 h-4 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-center border border-slate-800 transition-colors cursor-pointer shrink-0"
          title="Xem hướng dẫn tự động tạo Task"
        >
          ?
        </button>
      </div>

      {showAutoTaskHelp && (
        <AutoTaskHelpSection goalType={goalType} />
      )}

      {autoCreateTask && (
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium block">
            {goalType === "Time-boxed" 
              ? "Thời lượng mỗi phiên (phút) - Bỏ trống để chia đều tự động" 
              : "Thời lượng Task hàng ngày (phút)"}
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
