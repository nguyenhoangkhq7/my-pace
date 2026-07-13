import React, { useState } from "react";

interface GoalTaskInlineInputProps {
  placeholder?: string;
  onSubmit: (v: string) => void | Promise<void>;
  onCancel: () => void;
}

export function GoalTaskInlineInput({ placeholder, onSubmit, onCancel }: GoalTaskInlineInputProps) {
  const [val, setVal] = useState("");
  
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const t = val.trim();
      if (t) {
        await onSubmit(t);
        setVal("");
      } else {
        onCancel();
      }
    }
    if (e.key === 'Escape') onCancel();
  };

  const handleBlur = () => {
    const t = val.trim();
    if (t) {
      onSubmit(t);
    }
    onCancel();
  };

  return (
    <input
      autoFocus
      className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/50 w-full min-w-0"
      placeholder={placeholder || "Enter..."}
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
