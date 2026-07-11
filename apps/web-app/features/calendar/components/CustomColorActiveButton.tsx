"use client";

interface CustomColorActiveButtonProps {
  color: string;
  onClick: () => void;
}

export function CustomColorActiveButton({ color, onClick }: CustomColorActiveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-3.5 h-3.5 rounded-full border border-white ring-2 ring-white scale-105 shadow-md cursor-pointer transition-all"
      style={{ backgroundColor: color }}
      title={`Màu tự chọn: ${color}`}
    />
  );
}
