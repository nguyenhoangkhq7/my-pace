import { useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
import type { StatsOverviewResponse } from "../types";
import { getRangeBounds, formatDateStr } from "../utils/statsDateUtils";

export function useStatsPage() {
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  const { start, end } = useMemo(() => getRangeBounds(referenceDate, range), [referenceDate, range]);
  const startDateStr = formatDateStr(start);
  const endDateStr = formatDateStr(end);

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["stats", "overview", range, startDateStr, endDateStr],
    queryFn: () => {
      let url = 'stats/overview';
      const params: string[] = [];
      if (startDateStr) params.push(`startDate=${startDateStr}`);
      if (endDateStr) params.push(`endDate=${endDateStr}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      return fetchClient.get<StatsOverviewResponse>(url).then(r => r.data);
    },
    placeholderData: keepPreviousData,
  });

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

  const planVsActualData = useMemo(() => {
    if (!overview?.dailyTimeStats) return [];
    return overview.dailyTimeStats.map(item => {
      const dateParts = item.date.split("-");
      const label = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : item.date;
      return {
        date: label,
        fullDate: item.date,
        plannedHours: Math.round((item.plannedMinutes / 60) * 10) / 10,
        actualHours: Math.round((item.actualMinutes / 60) * 10) / 10,
        plannedMinutes: item.plannedMinutes,
        actualMinutes: item.actualMinutes,
      };
    });
  }, [overview]);

  return {
    overview,
    isLoading,
    error: error ? error.message : null,
    range,
    setRange,
    referenceDate,
    setReferenceDate,
    start,
    end,
    handlePrev,
    handleNext,
    matrixData,
    categoryData,
    planVsActualData,
  };
}
