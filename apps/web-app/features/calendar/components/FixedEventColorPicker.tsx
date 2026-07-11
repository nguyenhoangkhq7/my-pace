"use client";

import React from "react";
import { CustomColorPicker } from "@/components/ui/custom-color-picker";

interface FixedEventColorPickerProps {
  fixedEventColor: string;
  onColorChange: (color: string) => void;
}

export function FixedEventColorPicker({ fixedEventColor, onColorChange }: FixedEventColorPickerProps) {
  return (
    <CustomColorPicker color={fixedEventColor} onChange={onColorChange}>
      <button
        type="button"
        className="flex items-center gap-2 border border-border bg-card hover:bg-muted text-foreground text-xs px-3 h-8 rounded-xl shadow-xs transition-colors cursor-pointer"
        title="Đổi màu lịch cố định"
      >
        <span className="text-[10px] font-semibold text-muted-foreground">Màu lịch:</span>
        <div
          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
          style={{ backgroundColor: fixedEventColor }}
        />
      </button>
    </CustomColorPicker>
  );
}
