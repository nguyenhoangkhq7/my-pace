import React, { useState } from "react";

interface TaskInlineCreateFormProps {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

export function TaskInlineCreateForm({ onSubmit, onCancel }: TaskInlineCreateFormProps) {
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onSubmit(trimmed);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="p-2.5 bg-slate-900/60 rounded-md border border-primary/50 flex items-center">
      <input
        autoFocus
        className="bg-transparent border-none outline-none text-sm text-slate-200 w-full"
        placeholder="Nhập tên task và nhấn Enter..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCreate}
      />
    </div>
  );
}
