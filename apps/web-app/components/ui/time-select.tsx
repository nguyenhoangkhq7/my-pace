"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TimeSelectProps {
  value: string; // Format: "HH:mm"
  onChange: (val: string) => void;
  className?: string;
}

export function TimeSelect({ value, onChange, className }: TimeSelectProps) {
  const [hStr, mStr] = (value || "07:00").split(":");
  const currentHour = hStr || "07";
  const currentMin = mStr || "00";

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
  
  // Safeguard: if the current minutes value isn't a multiple of 5, append it dynamically to avoid breaking
  if (currentMin && !minutes.includes(currentMin)) {
    minutes.push(currentMin);
    minutes.sort();
  }

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value}:${currentMin}`);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${currentHour}:${e.target.value}`);
  };

  return (
    <div className={cn("flex items-center gap-1 w-full", className)}>
      <select
        value={currentHour}
        onChange={handleHourChange}
        className="flex-1 h-10 rounded-xl bg-card border border-border text-foreground px-3 text-xs font-mono font-semibold focus:outline-hidden focus:border-primary cursor-pointer text-center appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          backgroundSize: "10px",
          paddingRight: "24px"
        }}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground font-bold font-mono px-1">:</span>
      <select
        value={currentMin}
        onChange={handleMinChange}
        className="flex-1 h-10 rounded-xl bg-card border border-border text-foreground px-3 text-xs font-mono font-semibold focus:outline-hidden focus:border-primary cursor-pointer text-center appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          backgroundSize: "10px",
          paddingRight: "24px"
        }}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
