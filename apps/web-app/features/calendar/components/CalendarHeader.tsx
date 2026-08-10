"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { FixedEventColorPicker } from "./FixedEventColorPicker";
import { useTranslation } from "@/hooks/use-translation";
import { AlertTriangle, Lightbulb } from "lucide-react";

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
    <div className="flex items-center justify-between mb-2">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{t.calendar.calendarTitle}</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
                <span className="text-sm font-semibold">?</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px]" align="start">
              <PopoverHeader>
                <PopoverTitle>{t.calendar.autoScheduleHelpTitle}</PopoverTitle>
                <PopoverDescription>{t.calendar.autoScheduleHelpDesc}</PopoverDescription>
              </PopoverHeader>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex gap-2 text-foreground">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>{t.calendar.autoScheduleHelpQ2}</span>
                </div>
                <div className="flex gap-2 text-foreground">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-destructive shrink-0" />
                  <span>{t.calendar.autoScheduleHelpQ1}</span>
                </div>
                <div className="flex gap-2 text-foreground">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{t.calendar.autoScheduleHelpQ3}</span>
                </div>
                <div className="flex gap-2 text-foreground">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
                  <span>{t.calendar.autoScheduleHelpQ4}</span>
                </div>

                <div className="mt-1 flex flex-col gap-3 border-t border-border pt-3 text-muted-foreground text-xs">
                  <div className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />
                    <span>{t.calendar.autoScheduleHelpException}</span>
                  </div>
                  <div className="flex gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                    <span>{t.calendar.autoScheduleHelpRules}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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

