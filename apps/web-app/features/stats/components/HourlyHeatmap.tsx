"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HourlyHeatmapProps {
  /** Key = hour 0-23, value = total focus minutes in that hour across the selected range */
  data: Record<number, number>;
  className?: string;
}

function formatMinutes(min: number): string {
  if (min === 0) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function HourlyHeatmap({ data, className }: HourlyHeatmapProps) {
  const maxMinutes = useMemo(
    () => Math.max(1, ...Object.values(data)),
    [data]
  );

  const hours = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        minutes: data[h] ?? 0,
        label: `${String(h).padStart(2, "0")}h`,
      })),
    [data]
  );

  const totalMinutes = useMemo(
    () => Object.values(data).reduce((s, v) => s + v, 0),
    [data]
  );

  const peakHour = useMemo(() => {
    let best = { hour: -1, minutes: 0 };
    hours.forEach((h) => { if (h.minutes > best.minutes) best = h; });
    return best;
  }, [hours]);

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground text-base">Phân bố Focus theo Giờ</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Giờ nào bạn tập trung nhiều nhất</p>
        </div>
        {totalMinutes > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Tổng</p>
            <p className="font-mono font-bold text-sm text-foreground">{formatMinutes(totalMinutes)}</p>
          </div>
        )}
      </div>

      {/* Heatmap bars */}
      {totalMinutes === 0 ? (
        <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">
          Chưa có dữ liệu focus trong khoảng thời gian này
        </div>
      ) : (
        <>
          <div className="flex items-end gap-[3px] h-28">
            {hours.map(({ hour, minutes, label }) => {
              const ratio = minutes / maxMinutes;
              const isPeak = hour === peakHour.hour && minutes > 0;
              return (
                <div
                  key={hour}
                  className="group relative flex-1 flex flex-col items-center justify-end gap-1"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-popover border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg whitespace-nowrap">
                      <span className="text-muted-foreground">{label}</span>
                      {" — "}
                      <span className="font-bold">{formatMinutes(minutes)}</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-300",
                      isPeak
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        : ratio > 0
                        ? "bg-gradient-to-t from-indigo-500/60 to-indigo-400/40"
                        : "bg-muted/40"
                    )}
                    style={{ height: `${Math.max(ratio * 100, minutes > 0 ? 4 : 0)}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels — show every 3 hours */}
          <div className="flex gap-[3px]">
            {hours.map(({ hour, label }) => (
              <div key={hour} className="flex-1 text-center">
                {hour % 3 === 0 && (
                  <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
                )}
              </div>
            ))}
          </div>

          {/* Peak callout */}
          {peakHour.hour >= 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5">
              <span className="text-lg">⚡</span>
              <p className="text-xs text-indigo-300">
                Giờ vàng của bạn:{" "}
                <strong className="font-bold text-indigo-200">
                  {String(peakHour.hour).padStart(2, "0")}:00
                </strong>{" "}
                — focus{" "}
                <strong className="font-bold text-indigo-200">{formatMinutes(peakHour.minutes)}</strong>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
