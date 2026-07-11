"use client";

import { cn } from "@/lib/utils";
import { RECURRENCE_LABELS, RecurrenceType } from "../types";

interface RecurrenceTypeOptionProps {
  value: RecurrenceType;
  isSelected: boolean;
  onClick: () => void;
}

export function RecurrenceTypeOption({ value, isSelected, onClick }: RecurrenceTypeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium border transition-all cursor-pointer",
        isSelected
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      {RECURRENCE_LABELS[value]}
    </button>
  );
}
