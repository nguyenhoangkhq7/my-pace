import React from "react";
import { Goal } from "../types";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TargetDetailProps {
  goal: Goal;
  stats: {
    chartData: { name: string; minutes: number; count: number }[];
    totalMinutes: number;
    daysCompleted: number;
    totalCount: number;
  };
  timeFilter: "week" | "month" | "year";
  isFuturePeriod: () => boolean;
}

export function TargetDetail({ goal, stats, timeFilter, isFuturePeriod }: TargetDetailProps) {
  const isCurrent = isFuturePeriod();
  let periodLabel = "";
  if (timeFilter === "week") {
    periodLabel = isCurrent ? "Tuần này đạt được" : "Tuần đã chọn đạt được";
  } else if (timeFilter === "month") {
    periodLabel = isCurrent ? "Tháng này đạt được" : "Tháng đã chọn đạt được";
  } else if (timeFilter === "year") {
    periodLabel = isCurrent ? "Năm nay đạt được" : "Năm đã chọn đạt được";
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm text-slate-400 mb-1">Tiến độ chung</h3>
          <div className="text-2xl font-bold text-slate-100">
            {goal.milestoneGoal?.currentCount || 0} / {goal.milestoneGoal?.targetCount || 0}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-sm text-slate-400 mb-1">{periodLabel}</h3>
          <div className="text-2xl font-bold text-primary">+{stats.totalCount}</div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">
          Mức độ đạt được (
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
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "#1e293b" }}
                contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                itemStyle={{ color: "#8b5cf6" }}
                formatter={(value) => [`${value}`, "Số lượng"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count > 0 ? "#8b5cf6" : "#334155"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
