"use client";

import { useEffect, useMemo, useState } from "react";
import { useStatsStore } from "@/features/stats/store/stats.store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Flame, TrendingUp, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: { value: number }[], label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
        <p className="text-foreground font-medium mb-1">{label}</p>
        <p className="text-primary text-sm font-bold">
          {payload[0].value} phút
        </p>
      </div>
    );
  }
  return null;
};

const getRangeBounds = (refDate: Date, rangeType: "week" | "month" | "year") => {
  const date = new Date(refDate);

  if (rangeType === "week") {
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  } else if (rangeType === "month") {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: startOfMonth, end: endOfMonth };
  } else {
    const startOfYear = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start: startOfYear, end: endOfYear };
  }
};

const formatLabel = (start: Date, end: Date, rangeType: "week" | "month" | "year") => {
  const correctMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (rangeType === "week") {
    const startDay = start.getDate();
    const startMonth = correctMonths[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = correctMonths[end.getMonth()];
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${startYear}`;
    } else {
      return `${startDay} ${startMonth}, ${startYear} - ${endDay} ${endMonth}, ${endYear}`;
    }
  } else if (rangeType === "month") {
    const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${fullMonths[start.getMonth()]}, ${start.getFullYear()}`;
  } else {
    return `${start.getFullYear()}`;
  }
};

const formatDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function StatsPage() {
  const { overview, isLoading, error, fetchOverview } = useStatsStore();
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  const { start, end } = useMemo(() => getRangeBounds(referenceDate, range), [referenceDate, range]);

  useEffect(() => {
    const startDateStr = formatDateStr(start);
    const endDateStr = formatDateStr(end);
    fetchOverview(startDateStr, endDateStr);
  }, [fetchOverview, start, end]);

  const handlePrev = () => {
    setReferenceDate(prev => {
      const next = new Date(prev);
      if (range === "week") {
        next.setDate(next.getDate() - 7);
      } else if (range === "month") {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setFullYear(next.getFullYear() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setReferenceDate(prev => {
      const next = new Date(prev);
      if (range === "week") {
        next.setDate(next.getDate() + 7);
      } else if (range === "month") {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    });
  };

  const matrixData = useMemo(() => {
    if (!overview) return [];
    return [
      { name: "Q1: Khẩn cấp & Quan trọng", value: overview.matrixTime.q1 || 0, color: "#f43f5e" }, // Rose
      { name: "Q2: Quan trọng, Ko khẩn", value: overview.matrixTime.q2 || 0, color: "#10b981" },   // Emerald
      { name: "Q3: Khẩn cấp, Ko Q.Trọng", value: overview.matrixTime.q3 || 0, color: "#f59e0b" },  // Amber
      { name: "Q4: Ko Khẩn, Ko Q.Trọng", value: overview.matrixTime.q4 || 0, color: "#64748b" },   // Slate
    ];
  }, [overview]);

  const categoryData = useMemo(() => {
    if (!overview || !overview.categoryTime) return [];
    return Object.entries(overview.categoryTime)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [overview]);

  if (isLoading && !overview) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-rose-400">
        <div className="flex items-center gap-2 bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-8 bg-background text-foreground">
      
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">Progress Analytics</h1>
          <p className="text-muted-foreground">Nhìn lại thời gian và tiến độ hoàn thành công việc của bạn.</p>
        </div>

        {/* Filter Switcher and Navigators */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1.5 shadow-md">
          {/* Date Navigator */}
          <div className="flex items-center gap-3 px-2 border-r border-border/60">
            <button
              onClick={handlePrev}
              className="p-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-foreground min-w-[150px] text-center">
              {formatLabel(start, end, range)}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border cursor-pointer flex items-center justify-center"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Range Tabs (Week, Month, Year) */}
          <Tabs value={range} onValueChange={(val) => setRange(val as "week" | "month" | "year")} className="w-fit">
            <TabsList className="bg-transparent border-0 text-muted-foreground h-8 p-0 flex gap-1">
              <TabsTrigger value="week" className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg">Tuần</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg">Tháng</TabsTrigger>
              <TabsTrigger value="year" className="data-[state=active]:bg-muted data-[state=active]:text-foreground text-xs px-3 h-7 rounded-lg">Năm</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className={cn("space-y-8 transition-opacity duration-200", isLoading && "opacity-60")}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          
          {/* Completion Rate Card */}
          <div className="bg-card rounded-xl p-3.5 border border-border shadow-md relative overflow-hidden group flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hoàn thành</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-foreground">{overview?.completionRate ?? 0}</span>
                <span className="text-xs font-semibold text-emerald-400">%</span>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-card rounded-xl p-3.5 border border-border shadow-md relative overflow-hidden group flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-lg shrink-0">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Chuỗi streak</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold text-foreground">{overview?.streak ?? 0}</span>
                <span className="text-xs font-semibold text-orange-400">ngày</span>
              </div>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Matrix Chart */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-foreground">Thời gian theo Ma trận Eisenhower</h3>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matrixData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value.split(':')[0]} // Just show Q1, Q2, etc. on X axis
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.15 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {matrixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
              {matrixData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          {/* Category Chart */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-foreground">Thời gian theo Danh mục (Category)</h3>
            </div>

            <div className="h-80 w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.15 }} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Chưa có dữ liệu danh mục
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
