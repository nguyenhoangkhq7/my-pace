import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface GoalTaskTitleEditorProps {
  initialTitle: string;
  isDone: boolean;
  onSave: (newTitle: string) => Promise<void> | void;
}

export function GoalTaskTitleEditor({ initialTitle, isDone, onSave }: GoalTaskTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(initialTitle);
  }, [initialTitle]);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDone) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSaveWrapper = async () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== initialTitle) {
      try {
        await onSave(trimmed);
      } catch {
        setEditTitle(initialTitle);
      }
    } else {
      setEditTitle(initialTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveWrapper();
    if (e.key === 'Escape') {
      setEditTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="text-sm bg-transparent border-b border-primary outline-none text-foreground w-full min-w-0"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        onBlur={handleSaveWrapper}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={cn(
        "text-sm truncate",
        isDone ? "text-muted-foreground line-through" : "text-foreground",
        !isDone && "cursor-text"
      )}
      onClick={handleTitleClick}
      title={isDone ? undefined : "Click để sửa tên"}
    >
      {initialTitle}
    </span>
  );
}
