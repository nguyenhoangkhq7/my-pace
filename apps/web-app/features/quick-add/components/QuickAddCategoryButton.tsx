"use client";

import { useState } from "react";
import { Hash, Check, Plus, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCategories } from "@/features/board/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManageCategoriesModal } from "@/features/board/components/ManageCategoriesModal";
import { CATEGORY_COLORS } from "@/features/board/components/CategoryCreateForm";
import { CustomColorPicker } from "@/components/ui/custom-color-picker";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface QuickAddCategoryButtonProps {
  categoryId: string | null;
  onChange: (categoryId: string | null) => void;
  disabled?: boolean;
  inheritedGoalTitle?: string | null;
}

export function QuickAddCategoryButton({
  categoryId,
  onChange,
  disabled = false,
  inheritedGoalTitle = null,
}: QuickAddCategoryButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const { categories, createCategory } = useCategories();

  const activeCategory = categories.find((c) => c.id === categoryId);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setIsCreating(false);
  };

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || isSubmittingCat) return;
    setIsSubmittingCat(true);
    try {
      const created = await createCategory({
        name: newCatName.trim(),
        color: newCatColor,
      });
      onChange(created.id);
      setNewCatName("");
      setIsCreating(false);
      setOpen(false);
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const tooltipTitle = disabled && inheritedGoalTitle
    ? `${t.sunsamaForm.inheritedFromGoal}: ${inheritedGoalTitle}`
    : t.sunsamaForm.category;

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={tooltipTitle}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border border-border/60 bg-muted/30 text-foreground/80 cursor-default opacity-85 select-none"
      >
        {activeCategory?.color ? (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: activeCategory.color }}
          />
        ) : (
          <Hash className="h-3.5 w-3.5 opacity-70" />
        )}
        <span className="truncate max-w-[100px]">
          {activeCategory ? activeCategory.name : t.sunsamaForm.noCategory}
        </span>
      </button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setIsCreating(false); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={tooltipTitle}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
              activeCategory
                ? "bg-muted/60 text-foreground border-border/80 hover:bg-muted"
                : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            {activeCategory?.color ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeCategory.color }}
              />
            ) : (
              <Hash className="h-3.5 w-3.5 opacity-70" />
            )}
            <span className="truncate max-w-[100px]">
              {activeCategory ? activeCategory.name : t.sunsamaForm.category}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 space-y-2 bg-popover text-popover-foreground border-border shadow-lg" align="start">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.sunsamaForm.category}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 cursor-pointer"
                    title={t.sunsamaForm.newCategoryTitle}
                  >
                    <Plus className="h-3 w-3" />
                    <span>{t.sunsamaForm.newCategory}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsManaging(true); setOpen(false); }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    title={t.sunsamaForm.manageCategory}
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-7 text-xs font-normal"
                  onClick={() => handleSelect(null)}
                >
                  <span className="text-muted-foreground">{t.sunsamaForm.noCategory}</span>
                  {!categoryId && <Check className="h-3.5 w-3.5 text-primary" />}
                </Button>
                {categories.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 text-xs font-normal"
                    onClick={() => handleSelect(c.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    {categoryId === c.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleQuickCreateCategory} className="space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.sunsamaForm.newCategoryTitle}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t.sunsamaForm.back}
                </button>
              </div>

              <Input
                autoFocus
                placeholder={t.sunsamaForm.categoryNamePlaceholder}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-7 text-xs bg-muted/30"
              />

              <div className="flex flex-wrap gap-1 items-center pt-0.5">
                {CATEGORY_COLORS.slice(0, 7).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={cn(
                      "w-4 h-4 rounded-full cursor-pointer transition-all border border-black/20",
                      newCatColor === c ? "ring-2 ring-primary scale-110 shadow-xs" : "opacity-80 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <CustomColorPicker color={newCatColor} onChange={setNewCatColor}>
                  <button
                    type="button"
                    className="w-4 h-4 rounded-full border border-black/20 cursor-pointer flex items-center justify-center bg-[linear-gradient(45deg,#ff0000,#00ff00,#0000ff)] opacity-80 hover:opacity-100"
                    title={t.sunsamaForm.customColor}
                  >
                    <span className="text-[8px] text-white font-bold">+</span>
                  </button>
                </CustomColorPicker>
              </div>

              <div className="flex gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="h-6 text-xs flex-1"
                >
                  {t.sunsamaForm.cancel}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newCatName.trim() || isSubmittingCat}
                  className="h-6 text-xs flex-1"
                >
                  {isSubmittingCat ? t.sunsamaForm.creating : t.sunsamaForm.createAndSelect}
                </Button>
              </div>
            </form>
          )}
        </PopoverContent>
      </Popover>

      <ManageCategoriesModal isOpen={isManaging} onClose={() => setIsManaging(false)} />
    </>
  );
}
