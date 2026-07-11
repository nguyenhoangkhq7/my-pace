import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoardStore } from "../store/board.store";
import { cn } from "@/lib/utils";
import { CustomColorPicker } from "@/components/ui/custom-color-picker";

interface CategoryCreateFormProps {
  onCancel: () => void;
  onSuccess: (catId: string) => void;
}

const CATEGORY_COLORS = [
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#ec4899", // pink
  "#ef4444", // red
  "#475569", // slate
  "#64748b"  // slate-500
];

export function CategoryCreateForm({ onCancel, onSuccess }: CategoryCreateFormProps) {
  const { createCategory } = useBoardStore();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      onSuccess(cat.id);
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3 p-3 bg-muted border border-border rounded-md">
      <Input
        autoFocus
        placeholder="Category Name"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        className="bg-background border-border"
      />
      <div className="flex flex-wrap gap-1.5 items-center">
        {CATEGORY_COLORS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => {
              setNewCategoryColor(c);
            }}
            className={cn(
              "w-5 h-5 rounded-full cursor-pointer ring-offset-background border border-black/15 transition-all hover:scale-110 duration-200",
              newCategoryColor === c ? "ring-2 ring-foreground scale-105 shadow-md" : "opacity-85 hover:opacity-100"
            )}
            style={{ backgroundColor: c }}
          />
        ))}

        <CustomColorPicker color={newCategoryColor} onChange={setNewCategoryColor}>
          {!CATEGORY_COLORS.includes(newCategoryColor) ? (
            <button
              type="button"
              className="w-5 h-5 rounded-full border border-white ring-2 ring-white scale-105 shadow-md cursor-pointer transition-all"
              style={{ backgroundColor: newCategoryColor }}
              title={`Màu tự chọn: ${newCategoryColor}`}
            />
          ) : (
            <button
              type="button"
              className="w-5 h-5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-[linear-gradient(45deg,#ff0000,#00ff00,#0000ff)] opacity-85 hover:opacity-100"
              title="Tự chọn màu khác..."
            >
              <span className="text-[10px] text-white font-bold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">+</span>
            </button>
          )}
        </CustomColorPicker>
      </div>
      <div className="flex space-x-2 pt-1">
        <Button
          size="sm"
          type="button"
          variant="outline"
          className="h-7 text-xs border-border text-foreground flex-1 px-2"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          type="button"
          className="h-7 text-xs bg-primary text-primary-foreground flex-1 px-2"
          onClick={handleCreateCategory}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
