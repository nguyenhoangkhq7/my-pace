"use client";

import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function QuickAddInput({ onSubmit, isLoading }: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

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
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {t.quickAdd.hint}
      </p>
    </div>
  );
}
