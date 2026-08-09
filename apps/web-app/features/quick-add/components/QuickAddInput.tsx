"use client";

import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";
import { useQuickAddUIStore } from "../store/quickAddUI.store";

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
    <div className="border-b border-border px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <HugeiconsIcon
          icon={isLoading ? Loading03Icon : SparklesIcon}
          className={`h-5 w-5 shrink-0 ${isLoading ? "animate-spin text-primary" : "text-primary/70"}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.quickAdd.placeholder}
          disabled={isLoading}
          maxLength={300}
          className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">
            AI...
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground leading-relaxed">
        <span>{t.quickAdd.hint}</span>
        <button
          type="button"
          onClick={toggleAutoConfirm}
          className={`px-2 py-0.5 rounded transition-colors text-[11px] font-medium cursor-pointer border ${
            autoConfirm
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground"
          }`}
        >
          {t.quickAdd.autoConfirm}
        </button>
      </div>
    </div>
  );
}
