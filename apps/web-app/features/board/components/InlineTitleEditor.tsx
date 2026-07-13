import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface InlineTitleEditorProps {
  initialTitle: string;
  onSave: (newTitle: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
}

export function InlineTitleEditor({ initialTitle, onSave, className, inputClassName }: InlineTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [prevInitialTitle, setPrevInitialTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  if (initialTitle !== prevInitialTitle) {
    setPrevInitialTitle(initialTitle);
    setTitle(initialTitle);
  }


  // Ensure input is focused and text is selected when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!title.trim() || title === initialTitle) {
      setIsEditing(false);
      setTitle(initialTitle);
      return;
    }
    try {
      await onSave(title.trim());
    } catch (err) {
      console.error(err);
      setTitle(initialTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTitle(initialTitle);
    }
  };

  const stopEventPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        onClick={stopEventPropagation}
        onMouseDown={stopEventPropagation}
        onMouseUp={stopEventPropagation}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      onMouseDown={stopEventPropagation}
      onMouseUp={stopEventPropagation}
      className={className}
    >
      {title}
    </span>
  );
}
