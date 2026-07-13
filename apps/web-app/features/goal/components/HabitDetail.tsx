import React from "react";
import { Goal } from "../types";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Time02Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t, locale } = useTranslation();
  const isVi = locale === "vi";

  const durationMins = goal.durationMinutes || 0;
  const daysPerWeek = goal.daysOfWeek?.split(',').filter(Boolean).length || 7;
  const weeklyMins = durationMins * daysPerWeek;

  let targetMinsForPeriod = 0;
  let label = "";
  let daysLabel = "";

  const isCurrent = isFuturePeriod();
  if (timeFilter === "week") {
    targetMinsForPeriod = weeklyMins;
    label = isCurrent ? t.goals.totalMinutesWeekCurrent : t.goals.totalMinutesWeekSelected;
    daysLabel = isVi ? "/ 7 ngày" : "/ 7 days";
  } else if (timeFilter === "month") {
    targetMinsForPeriod = (weeklyMins / 7) * 30;
    label = isCurrent ? t.goals.totalMinutesMonthCurrent : t.goals.totalMinutesMonthSelected;
    const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
    daysLabel = isVi ? `/ ${daysInMonth} ngày` : `/ ${daysInMonth} days`;
  } else if (timeFilter === "year") {
    targetMinsForPeriod = (weeklyMins / 7) * 365;
    label = isCurrent ? t.goals.totalMinutesYearCurrent : t.goals.totalMinutesYearSelected;
    daysLabel = isVi ? "/ 12 tháng" : "/ 12 months";
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card/50 p-4 rounded-xl border border-border">
          <h3 className="text-sm text-muted-foreground mb-1 flex items-center">
            <HugeiconsIcon icon={Time02Icon} size={14} className="mr-1" /> {label}
          </h3>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalMinutes} <span className="text-sm text-muted-foreground font-normal">/ {Math.round(targetMinsForPeriod)} {isVi ? "ph" : "mins"}</span>
          </div>
        </div>
        <div className="bg-card/50 p-4 rounded-xl border border-border">
          <h3 className="text-sm text-muted-foreground mb-1 flex items-center">
            <HugeiconsIcon icon={Calendar01Icon} size={14} className="mr-1" /> {t.goals.daysCompleted}
          </h3>
          <div className="text-2xl font-bold text-foreground">
            {stats.daysCompleted} <span className="text-sm text-muted-foreground font-normal">{daysLabel}</span>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {t.goals.timeChart} (
          {timeFilter === "week"
            ? isCurrent
              ? (isVi ? "Tuần này" : "This week")
              : (isVi ? "Tuần đã chọn" : "Selected week")
            : timeFilter === "month"
            ? isCurrent
              ? (isVi ? "Tháng này" : "This month")
              : (isVi ? "Tháng đã chọn" : "Selected month")
            : isCurrent
            ? (isVi ? "Năm nay" : "This year")
            : (isVi ? "Năm đã chọn" : "Selected year")}
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
                formatter={(value) => [`${value} ${isVi ? "phút" : "mins"}`, isVi ? "Thời gian" : "Time"]}
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
