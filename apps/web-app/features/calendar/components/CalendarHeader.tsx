"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FixedEventColorPicker } from "./FixedEventColorPicker";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.calendar.calendarTitle}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.calendar.calendarDesc}
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
            className="text-xs h-8 border-border bg-card hover:bg-muted text-foreground transition-colors rounded-xl px-3"
          >
            {isSidebarOpen ? t.calendar.hideTodo : t.calendar.showTodo}
          </Button>
        )}
      </div>
    </div>
  );
}

