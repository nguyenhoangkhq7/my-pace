"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useQuickAddUIStore } from "../store/quickAddUI.store";
import { cn } from "@/lib/utils";

interface QuickAddInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function QuickAddInput({ onSubmit, isLoading }: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { autoConfirm, toggleAutoConfirm } = useQuickAddUIStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.quickAdd.placeholder}
        disabled={isLoading}
        maxLength={255}
        className="flex-1 bg-transparent border-none outline-none text-[14px] sm:text-[15px] font-normal text-foreground placeholder:text-muted-foreground/45 disabled:opacity-50 selection:bg-primary/20"
        autoComplete="off"
        spellCheck={false}
      />

      {isLoading ? (
        <span className="text-[11px] font-medium text-primary animate-pulse px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 shrink-0">
          AI...
        </span>
      ) : (
        <button
          type="button"
          onClick={toggleAutoConfirm}
          title={t.quickAdd.autoConfirm}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border select-none shrink-0",
            autoConfirm
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 shadow-2xs"
              : "bg-muted/30 text-muted-foreground/60 border-border/40 hover:text-foreground hover:bg-muted/60"
          )}
        >
          <kbd className="text-[10px] font-mono leading-none opacity-80">↵</kbd>
          <span className="text-[11px]">{t.quickAdd.autoConfirm}</span>
        </button>
      )}
    </div>
  );
}
