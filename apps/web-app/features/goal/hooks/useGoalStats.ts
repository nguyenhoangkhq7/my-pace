import { useState, useMemo } from "react";
import { Goal } from "../types";
import { Task } from "@/features/board/types";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameMonth,
  addWeeks,
  addMonths,
  addYears,
} from "date-fns";

export function useGoalStats(goal: Goal | null, tasks: Task[]) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('week');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  const [prevGoalId, setPrevGoalId] = useState<string | undefined>(goal?.id);
  if (goal?.id !== prevGoalId) {
    setPrevGoalId(goal?.id);
    setTimeFilter('week');
    setReferenceDate(new Date());
  }

  const handlePrev = () => {
    setReferenceDate((prev) => {
      if (timeFilter === 'week') return addWeeks(prev, -1);
      if (timeFilter === 'month') return addMonths(prev, -1);
      return addYears(prev, -1);
    });
  };

  const handleNext = () => {
    setReferenceDate((prev) => {
      if (timeFilter === 'week') return addWeeks(prev, 1);
      if (timeFilter === 'month') return addMonths(prev, 1);
      return addYears(prev, 1);
    });
  };

  const isFuturePeriod = () => {
    const today = new Date();
    if (timeFilter === 'week') {
      return startOfWeek(referenceDate, { weekStartsOn: 1 }) >= startOfWeek(today, { weekStartsOn: 1 });
    }
    if (timeFilter === 'month') {
      return startOfMonth(referenceDate) >= startOfMonth(today);
    }
    return startOfYear(referenceDate) >= startOfYear(today);
  };

  const getPeriodLabel = () => {
    if (timeFilter === 'week') {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM")} - ${format(end, "d MMM, yyyy")}`;
    }
    if (timeFilter === 'month') {
      return `Tháng ${format(referenceDate, "M, yyyy")}`;
    }
    return `Năm ${format(referenceDate, "yyyy")}`;
  };

  const goalTasks = useMemo(() => {
    if (!goal) return [];
    return tasks.filter((t) => t.goalId === goal.id);
  }, [tasks, goal]);

  const stats = useMemo(() => {
    if (!goal || goal.goalType === 'Binary') {
      return { chartData: [], totalMinutes: 0, daysCompleted: 0, totalCount: 0 };
    }

    let chartData: { name: string; minutes: number; count: number }[] = [];
    let totalMinutes = 0;
    let daysCompleted = 0;
    let totalCount = 0;

    if (timeFilter === 'week') {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      chartData = days.map((day) => {
        const tasksOnDay = goalTasks.filter(
          (t) => t.dueDate && isSameDay(new Date(t.dueDate), day) && t.status === 'Done'
        );
        const minutes = tasksOnDay.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
        const count = tasksOnDay.length;
        if (minutes > 0) totalMinutes += minutes;
        if (count > 0) {
          totalCount += count;
          daysCompleted += 1;
        }
        return { name: format(day, "EEE"), minutes, count };
      });

    } else if (timeFilter === 'month') {
      const start = startOfMonth(referenceDate);
      const end = endOfMonth(referenceDate);
      const days = eachDayOfInterval({ start, end });

      chartData = days.map((day) => {
        const tasksOnDay = goalTasks.filter(
          (t) => t.dueDate && isSameDay(new Date(t.dueDate), day) && t.status === 'Done'
        );
        const minutes = tasksOnDay.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
        const count = tasksOnDay.length;
        if (minutes > 0) totalMinutes += minutes;
        if (count > 0) {
          totalCount += count;
          daysCompleted += 1;
        }
        return { name: format(day, "d"), minutes, count };
      });

    } else if (timeFilter === 'year') {
      const start = startOfYear(referenceDate);
      const end = endOfYear(referenceDate);
      const months = eachMonthOfInterval({ start, end });

      chartData = months.map((month) => {
        const tasksInMonth = goalTasks.filter(
          (t) => t.dueDate && isSameMonth(new Date(t.dueDate), month) && t.status === 'Done'
        );
        const minutes = tasksInMonth.reduce((acc, t) => acc + (t.actualMinutes || 0), 0);
        const count = tasksInMonth.length;
        if (minutes > 0) totalMinutes += minutes;
        if (count > 0) {
          totalCount += count;
          daysCompleted += 1;
        }
        return { name: format(month, "MMM"), minutes, count };
      });
    }

    return { chartData, totalMinutes, daysCompleted, totalCount };
  }, [goalTasks, goal, timeFilter, referenceDate]);

  return {
    timeFilter,
    setTimeFilter,
    referenceDate,
    setReferenceDate,
    handlePrev,
    handleNext,
    isFuturePeriod,
    getPeriodLabel,
    goalTasks,
    stats,
  };
}
