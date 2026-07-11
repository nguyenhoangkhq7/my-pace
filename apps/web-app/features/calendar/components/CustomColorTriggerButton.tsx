"use client";

interface CustomColorTriggerButtonProps {
  onClick: () => void;
}

export function CustomColorTriggerButton({ onClick }: CustomColorTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-3.5 h-3.5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-[linear-gradient(45deg,#ff0000,#00ff00,#0000ff)] opacity-85 hover:opacity-100"
      title="Tự chọn màu khác..."
    >
      <span className="text-[9px] text-white font-bold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">+</span>
    </button>
  );
}
