"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CalendarRange } from "lucide-react";
import { ChartHeader } from "./ChartHeader";

interface PlanVsActualItem {
  date: string;
  plannedHours: number;
  actualHours: number;
  plannedMinutes: number;
  actualMinutes: number;
}

interface PlanVsActualChartProps {
  data: PlanVsActualItem[];
}

export function PlanVsActualChart({ data }: PlanVsActualChartProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl space-y-4">
      <ChartHeader
        title="Thời Gian: Kế Hoạch vs. Thực Tế (Giờ)"
        icon={<CalendarRange className="w-5 h-5 text-sky-400" />}
      />

      <div className="h-80 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  color: "var(--popover-foreground)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar name="Kế hoạch (giờ)" dataKey="plannedHours" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar name="Thực tế (giờ)" dataKey="actualHours" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Chưa có dữ liệu kế hoạch & thực tế trong khoảng thời gian này
          </div>
        )}
      </div>
    </div>
  );
}
