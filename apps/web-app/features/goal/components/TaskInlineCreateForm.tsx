import React, { useState } from "react";

interface TaskInlineCreateFormProps {
  onSubmit: (title: string) => void | Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  indent?: boolean;
}

export function TaskInlineCreateForm({ onSubmit, onCancel, placeholder, indent }: TaskInlineCreateFormProps) {
  const [title, setTitle] = useState("");

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = title.trim();
      if (trimmed) {
        await onSubmit(trimmed);
        setTitle("");
      } else {
        onCancel();
      }
    }
    if (e.key === 'Escape') onCancel();
  };

  const handleBlur = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
    onCancel();
  };

  return (
    <div className={`p-2.5 bg-card rounded-md border border-primary/50 flex items-center ${indent ? 'ml-8' : ''}`}>
      <input
        autoFocus
        className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
        placeholder={placeholder || "Nhập tên task và nhấn Enter..."}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
}
