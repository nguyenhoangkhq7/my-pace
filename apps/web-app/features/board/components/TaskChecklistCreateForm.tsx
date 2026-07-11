import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TaskChecklistCreateFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export function TaskChecklistCreateForm({ onSubmit }: TaskChecklistCreateFormProps) {
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    await onSubmit(newChecklistTitle.trim());
    setNewChecklistTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <Input 
        value={newChecklistTitle}
        onChange={e => setNewChecklistTitle(e.target.value)}
        placeholder="Thêm một mục"
        className="bg-slate-900 border-slate-800 h-9 text-slate-200"
      />
      <Button type="submit" size="sm" variant="secondary" className="h-9 cursor-pointer">
        Thêm
      </Button>
    </form>
  );
}
