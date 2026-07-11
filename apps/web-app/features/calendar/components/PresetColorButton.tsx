"use client";

import { cn } from "@/lib/utils";

interface PresetColorButtonProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

export function PresetColorButton({ color, isSelected, onClick }: PresetColorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-3.5 h-3.5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 duration-200",
        isSelected ? "ring-2 ring-white scale-105 shadow-md" : "opacity-85 hover:opacity-100"
      )}
      style={{ backgroundColor: color }}
      title="Đổi màu lịch cố định"
    />
  );
}
