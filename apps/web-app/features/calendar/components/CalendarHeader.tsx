"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FixedEventColorPicker } from "./FixedEventColorPicker";

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
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kéo task từ sidebar → lịch · Click để tạo sự kiện · Kéo thả để di chuyển
        </p>
      </div>
      <div className="flex items-center gap-2">
        <FixedEventColorPicker
          fixedEventColor={fixedEventColor}
          onColorChange={onColorChange}
        />

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

