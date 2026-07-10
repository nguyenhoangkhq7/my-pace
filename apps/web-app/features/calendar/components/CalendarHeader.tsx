"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESET_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#6366f1", "#14b8a6", "#ec4899", "#ef4444", "#475569"];

interface CalendarHeaderProps {
  fixedEventColor: string;
  onColorChange: (color: string) => void;
  hasUnscheduled: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function CalendarHeader({
  fixedEventColor,
  onColorChange,
  hasUnscheduled,
  isSidebarOpen,
  onToggleSidebar,
}: CalendarHeaderProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kéo task từ sidebar → lịch · Click để tạo sự kiện · Kéo thả để di chuyển
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Color Selector for Fixed Events */}
        <div className="flex items-center gap-2 border border-border bg-muted/20 rounded-xl px-3 h-8 shadow-inner">
          <span className="text-[10px] font-semibold text-muted-foreground">Màu lịch cố định:</span>
          <div className="flex gap-1.5 items-center">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={cn(
                  "w-3.5 h-3.5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 duration-200",
                  fixedEventColor === color ? "ring-2 ring-white scale-105 shadow-md" : "opacity-85 hover:opacity-100"
                )}
                style={{ backgroundColor: color }}
                title="Đổi màu lịch cố định"
              />
            ))}
            
            {!PRESET_COLORS.includes(fixedEventColor) && (
              <button
                onClick={() => colorInputRef.current?.click()}
                className="w-3.5 h-3.5 rounded-full border border-white ring-2 ring-white scale-105 shadow-md cursor-pointer transition-all"
                style={{ backgroundColor: fixedEventColor }}
                title={`Màu tự chọn: ${fixedEventColor}`}
              />
            )}

            <button
              onClick={() => colorInputRef.current?.click()}
              className="w-3.5 h-3.5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-[linear-gradient(45deg,#ff0000,#00ff00,#0000ff)] opacity-85 hover:opacity-100"
              title="Tự chọn màu khác..."
            >
              <span className="text-[9px] text-white font-bold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">+</span>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={fixedEventColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        {hasUnscheduled && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleSidebar}
            className="text-xs h-8 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 transition-colors rounded-xl px-3"
          >
            {isSidebarOpen ? "Ẩn Todo" : "Hiện Todo"}
          </Button>
        )}
      </div>
    </div>
  );
}
