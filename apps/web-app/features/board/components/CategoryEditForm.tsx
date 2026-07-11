import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Category } from "../types";
import { CustomColorPicker } from "@/components/ui/custom-color-picker";

const CATEGORY_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#6366f1", "#14b8a6", "#ec4899", "#ef4444", "#475569"];

interface CategoryEditFormProps {
  category: Category;
  onSave: (id: string, name: string, color: string) => Promise<void>;
  onCancel: () => void;
}

export function CategoryEditForm({ category, onSave, onCancel }: CategoryEditFormProps) {
  const [editName, setEditName] = useState(category.name);
  const [editColor, setEditColor] = useState(category.color || CATEGORY_COLORS[0]);

  const handleSave = () => {
    onSave(category.id, editName, editColor);
  };

  return (
    <div className="space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-md">
      <Input
        autoFocus
        placeholder="Tên Category"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        className="bg-slate-950 border-slate-800 text-sm h-9"
      />
      <div className="flex flex-wrap gap-1.5 items-center">
        {CATEGORY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setEditColor(color)}
            className={cn(
              "w-5 h-5 rounded-full cursor-pointer ring-offset-slate-900 border border-black/15 transition-all hover:scale-110 duration-200",
              editColor === color ? "ring-2 ring-white scale-105 shadow-md" : "opacity-85 hover:opacity-100"
            )}
            style={{ backgroundColor: color }}
          />
        ))}

        <CustomColorPicker color={editColor} onChange={setEditColor}>
          {!CATEGORY_COLORS.includes(editColor) ? (
            <button
              type="button"
              className="w-5 h-5 rounded-full border border-white ring-2 ring-white scale-105 shadow-md cursor-pointer transition-all"
              style={{ backgroundColor: editColor }}
              title={`Màu tự chọn: ${editColor}`}
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
          variant="outline"
          className="h-7 text-xs border-slate-700 text-slate-300 flex-1 px-2 cursor-pointer"
          onClick={onCancel}
        >
          Hủy
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-primary text-white flex-1 px-2 cursor-pointer"
          onClick={handleSave}
        >
          Lưu
        </Button>
      </div>
    </div>
  );
}
