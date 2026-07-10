import { useState, useEffect, useMemo } from "react";
import { useStatsStore } from "@/features/stats/store/stats.store";
import { getRangeBounds, formatDateStr } from "../utils/statsDateUtils";

export function useStatsPage() {
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

  return {
    overview,
    isLoading,
    error,
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
  };
}
