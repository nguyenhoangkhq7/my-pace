"use client";

import { cn } from "@/lib/utils";

interface DayOfWeekOptionProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export function DayOfWeekOption({ label, isSelected, onClick }: DayOfWeekOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-9 h-9 rounded-full text-xs font-semibold border transition-all cursor-pointer",
        isSelected
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:border-primary/50"
      )}
    >
      {label}
    </button>
  );
}
