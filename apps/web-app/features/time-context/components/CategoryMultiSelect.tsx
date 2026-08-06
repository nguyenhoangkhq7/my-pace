import { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useTranslation } from "@/hooks/use-translation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryMultiSelect({ selectedIds = [], onChange }: CategoryMultiSelectProps) {
  const { t } = useTranslation();
  const { categories = [], isLoading } = useCategories();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategories = categories.filter((c) => selectedIds.includes(c.id));

  const handleRemove = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== catId));
  };

  const handleToggle = (catId: string) => {
    if (selectedIds.includes(catId)) {
      onChange(selectedIds.filter((id) => id !== catId));
    } else {
      onChange([...selectedIds, catId]);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase">
        {t.timeContext.categoriesLabel}
      </label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="min-h-10 w-full p-2 bg-background border border-border rounded-xl flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-primary/50 transition-colors focus:outline-hidden focus:ring-1 focus:ring-primary">
            {selectedCategories.length === 0 ? (
              <span className="text-xs text-muted-foreground pl-1">
                {t.timeContext.noContextDefault}
              </span>
            ) : (
              selectedCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-xs animate-in fade-in zoom-in duration-150"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(cat.id, e)}
                    className="hover:bg-black/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </span>
              ))
            )}

            <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          className="w-(--radix-popover-trigger-width) bg-card border border-border p-1 shadow-lg max-h-56 overflow-y-auto scrollbar-thin"
        >
          {isLoading ? (
            <p className="p-3 text-xs text-muted-foreground text-center">Đang tải danh mục...</p>
          ) : categories.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground text-center">Chưa có danh mục nào được tạo.</p>
          ) : (
            <div className="space-y-0.5">
              {categories.map((cat) => {
                const isSelected = selectedIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggle(cat.id)}
                    className={`w-full flex items-center justify-between p-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
