"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TodayOverview() {
  const { tasks } = useTasks();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isDone).length;
    const overdue = tasks.filter((t) => {
      if (t.isDone || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      return due.getTime() < now.getTime();
    }).length;

    return { total, completed, overdue };
  }, [tasks]);

  const { total, completed, overdue } = stats;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const offset = useMemo(
    () => CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE,
    [percentage],
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-100">
        Today&apos;s Overview
      </h3>

      {/* Circular Progress Ring */}
      <div className="flex justify-center mt-4">
        <svg
          width={120}
          height={120}
          viewBox="0 0 120 120"
          className="transform"
        >
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            className="text-slate-800"
          />

          {/* Progress circle */}
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="origin-center -rotate-90 transition-[stroke-dashoffset] duration-1000 ease-out"
          />

          {/* Center text */}
          <text
            x={60}
            y={56}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-100 text-2xl font-bold"
            fontSize={24}
            fontWeight={700}
          >
            {percentage}%
          </text>
          <text
            x={60}
            y={72}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-400"
            fontSize={10}
          >
            Completed
          </text>
        </svg>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-slate-100">{total}</span>
          <span className="text-[10px] text-slate-400">Total</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-emerald-400">
            {completed}
          </span>
          <span className="text-[10px] text-slate-400">Done</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-rose-400">{overdue}</span>
          <span className="text-[10px] text-slate-400">Overdue</span>
        </div>
      </div>
    </div>
  );
}
