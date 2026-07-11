import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { Category } from "../types";

interface CategoryListItemProps {
  category: Category;
  onStartEdit: () => void;
  onDeleteClick: () => void;
}

export function CategoryListItem({ category, onStartEdit, onDeleteClick }: CategoryListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-md hover:border-slate-700 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: category.color }} />
        <span className="text-sm font-medium text-slate-200">{category.name}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          onClick={onStartEdit}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-slate-850 cursor-pointer"
          onClick={onDeleteClick}
        >
          <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
