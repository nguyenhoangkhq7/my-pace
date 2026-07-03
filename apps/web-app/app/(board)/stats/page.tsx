"use client";

import { useEffect, useMemo } from "react";
import { useStatsStore } from "@/features/stats/store/stats.store";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Flame, CheckCircle2, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-medium mb-1">{label}</p>
        <p className="text-cyan-400 text-sm font-bold">
          {payload[0].value} phút
        </p>
      </div>
    );
  }
  return null;
};

export default function StatsPage() {
  const { overview, isLoading, error, fetchOverview } = useStatsStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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

  if (isLoading) {
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
    <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-8 bg-[#0a0f1e] text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Thống kê 30 ngày qua</h1>
        <p className="text-slate-400">Nhìn lại thời gian và tiến độ hoàn thành công việc của bạn.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        
        {/* Completion Rate Card */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl p-5 border border-[#334155] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Tỉ lệ hoàn thành kế hoạch</h3>
          </div>
          <div className="relative z-10 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{overview?.completionRate ?? 0}</span>
            <span className="text-lg font-medium text-emerald-400">%</span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl p-5 border border-[#334155] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-20 h-20 text-orange-400" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="bg-orange-500/20 p-2.5 rounded-lg">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Chuỗi ngày liên tục</h3>
          </div>
          <div className="relative z-10 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{overview?.streak ?? 0}</span>
            <span className="text-lg font-medium text-orange-400">ngày</span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Matrix Chart */}
        <div className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937] shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-slate-200">Thời gian theo Ma trận Eisenhower</h3>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matrixData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => value.split(':')[0]} // Just show Q1, Q2, etc. on X axis
                />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
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
              <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937] shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-200">Thời gian theo Danh mục (Category)</h3>
          </div>

          <div className="h-80 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} maxBarSize={40} />
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
  );
}
