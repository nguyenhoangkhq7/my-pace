import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { Clock } from "lucide-react";
import { useTimeContexts } from "@/features/time-context";
import { Category } from "../types";

interface CategoryListItemProps {
  category: Category;
  onStartEdit: () => void;
  onDeleteClick: () => void;
}

export function CategoryListItem({ category, onStartEdit, onDeleteClick }: CategoryListItemProps) {
  const { timeContexts } = useTimeContexts();
  const matchedContext = timeContexts.find((tc) => tc.id === category.timeContextId);

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-md hover:border-border/70 transition-colors">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-4 h-4 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: category.color }} />
        <span className="text-sm font-medium text-foreground truncate">{category.name}</span>
        {matchedContext && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            {matchedContext.name}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
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
