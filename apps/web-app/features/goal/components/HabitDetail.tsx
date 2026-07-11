import React from "react";
import { Goal } from "../types";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Time02Icon } from "@hugeicons/core-free-icons";

interface HabitDetailProps {
  goal: Goal;
  stats: {
    chartData: { name: string; minutes: number; count: number }[];
    totalMinutes: number;
    daysCompleted: number;
    totalCount: number;
  };
  timeFilter: "week" | "month" | "year";
  referenceDate: Date;
  isFuturePeriod: () => boolean;
}

export function HabitDetail({
  goal,
  stats,
  timeFilter,
  referenceDate,
  isFuturePeriod,
}: HabitDetailProps) {
  const targetMins = goal.timeBoxedGoal?.targetMinutes || 0;
  const periodDays = Math.max(goal.timeBoxedGoal?.periodDays || 1, 1);

  let targetMinsForPeriod = 0;
  let label = "";
  let daysLabel = "";

  const isCurrent = isFuturePeriod();
  if (timeFilter === "week") {
    targetMinsForPeriod = (targetMins / periodDays) * 7;
    label = isCurrent ? "Tổng phút tuần này" : "Tổng phút tuần đã chọn";
    daysLabel = "/ 7 ngày";
  } else if (timeFilter === "month") {
    targetMinsForPeriod = (targetMins / periodDays) * 30;
    label = isCurrent ? "Tổng phút tháng này" : "Tổng phút tháng đã chọn";
    daysLabel = `/ ${new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()} ngày`;
  } else if (timeFilter === "year") {
    targetMinsForPeriod = (targetMins / periodDays) * 365;
    label = isCurrent ? "Tổng phút năm nay" : "Tổng phút năm đã chọn";
    daysLabel = "/ 12 tháng";
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card/50 p-4 rounded-xl border border-border">
          <h3 className="text-sm text-muted-foreground mb-1 flex items-center">
            <HugeiconsIcon icon={Time02Icon} size={14} className="mr-1" /> {label}
          </h3>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalMinutes} <span className="text-sm text-muted-foreground font-normal">/ {Math.round(targetMinsForPeriod)} ph</span>
          </div>
        </div>
        <div className="bg-card/50 p-4 rounded-xl border border-border">
          <h3 className="text-sm text-muted-foreground mb-1 flex items-center">
            <HugeiconsIcon icon={Calendar01Icon} size={14} className="mr-1" /> Số ngày thực hiện
          </h3>
          <div className="text-2xl font-bold text-foreground">
            {stats.daysCompleted} <span className="text-sm text-muted-foreground font-normal">{daysLabel}</span>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Biểu đồ thời gian (
          {timeFilter === "week"
            ? isCurrent
              ? "Tuần này"
              : "Tuần đã chọn"
            : timeFilter === "month"
            ? isCurrent
              ? "Tháng này"
              : "Tháng đã chọn"
            : isCurrent
            ? "Năm nay"
            : "Năm đã chọn"}
          )
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "8px" }}
                itemStyle={{ color: "var(--primary)" }}
                formatter={(value) => [`${value} phút`, "Thời gian"]}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {stats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? "var(--primary)" : "var(--muted)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
