import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Category } from "../types";
import { CATEGORY_COLORS } from "../hooks/useTaskForm";

interface CategorySelectorSectionProps {
  isCreatingCategory: boolean;
  setIsCreatingCategory: (val: boolean) => void;
  categoryId: string | undefined;
  setCategoryId: (val: string | undefined) => void;
  goalId: string | undefined;
  newCategoryName: string;
  setNewCategoryName: (val: string) => void;
  newCategoryColor: string;
  setNewCategoryColor: (val: string) => void;
  categoryColorInputRef: React.RefObject<HTMLInputElement | null>;
  handleCreateCategory: () => Promise<void>;
  categories: Category[];
  setIsManagingCategories: (val: boolean) => void;
}

export function CategorySelectorSection({
  isCreatingCategory,
  setIsCreatingCategory,
  categoryId,
  setCategoryId,
  goalId,
  newCategoryName,
  setNewCategoryName,
  newCategoryColor,
  setNewCategoryColor,
  categoryColorInputRef,
  handleCreateCategory,
  categories,
  setIsManagingCategories,
}: CategorySelectorSectionProps) {
  return (
    <div className="grid gap-2">
      <Label>Category</Label>
      {isCreatingCategory ? (
        <div className="space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-md">
          <Input 
            autoFocus
            placeholder="Category Name" 
            value={newCategoryName} 
            onChange={e => setNewCategoryName(e.target.value)} 
            className="bg-slate-950 border-slate-800"
          />
          <div className="flex flex-wrap gap-1.5 items-center">
            {CATEGORY_COLORS.map(c => (
              <button
                type="button"
                key={c} 
                onClick={() => setNewCategoryColor(c)}
                className={cn("w-5 h-5 rounded-full cursor-pointer ring-offset-slate-900 border border-black/15 transition-all hover:scale-110 duration-200", newCategoryColor === c ? "ring-2 ring-white scale-105 shadow-md" : "opacity-85 hover:opacity-100")}
                style={{ backgroundColor: c }}
              />
            ))}

            {!CATEGORY_COLORS.includes(newCategoryColor) && (
              <button
                type="button"
                onClick={() => categoryColorInputRef.current?.click()}
                className="w-5 h-5 rounded-full border border-white ring-2 ring-white scale-105 shadow-md cursor-pointer transition-all"
                style={{ backgroundColor: newCategoryColor }}
                title={`Màu tự chọn: ${newCategoryColor}`}
              />
            )}

            <button
              type="button"
              onClick={() => categoryColorInputRef.current?.click()}
              className="w-5 h-5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-[linear-gradient(45deg,#ff0000,#00ff00,#0000ff)] opacity-85 hover:opacity-100"
              title="Tự chọn màu khác..."
            >
              <span className="text-[10px] text-white font-bold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">+</span>
            </button>
            <input
              ref={categoryColorInputRef}
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="sr-only"
            />
          </div>
          <div className="flex space-x-2 pt-1">
            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 flex-1 px-2" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs bg-primary text-white flex-1 px-2" onClick={handleCreateCategory}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="flex space-x-1.5">
          <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? undefined : val)} disabled={!!goalId && goalId !== "none"}>
            <SelectTrigger className="w-full bg-slate-900 border-slate-800">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
              <SelectItem value="none">No Category</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-2 shrink-0" onClick={() => setIsCreatingCategory(true)} disabled={!!goalId && goalId !== "none"} title="Thêm Category">
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-2 shrink-0" onClick={() => setIsManagingCategories(true)} title="Quản lý Category">
            <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
