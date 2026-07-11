import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CategoryCreateForm } from "@/features/board/components/CategoryCreateForm";
import { useBoardStore } from "@/features/board/store/board.store";
import { useTranslation } from "@/hooks/use-translation";

interface GoalFormCategoryFieldsProps {
  categoryId: string;
  setCategoryId: (val: string) => void;
  isCreatingCategory: boolean;
  setIsCreatingCategory: (val: boolean) => void;
  setIsManagingCategories: (val: boolean) => void;
}

export function GoalFormCategoryFields({
  categoryId,
  setCategoryId,
  isCreatingCategory,
  setIsCreatingCategory,
  setIsManagingCategories,
}: GoalFormCategoryFieldsProps) {
  const { categories } = useBoardStore();
  const { t } = useTranslation();

  const handleCategoryCreateSuccess = (catId: string) => {
    setCategoryId(catId);
    setIsCreatingCategory(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t.goals.categoryLabel}</label>
      {isCreatingCategory ? (
        <CategoryCreateForm
          onCancel={() => setIsCreatingCategory(false)}
          onSuccess={handleCategoryCreateSuccess}
        />
      ) : (
        <div className="flex items-center space-x-1.5">
          <Select
             value={categoryId}
             onValueChange={(val: string) => setCategoryId(val)}
          >
            <SelectTrigger className="w-full bg-card border-border">
              <SelectValue placeholder={t.goals.categoryLabel} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-foreground">
              <SelectItem value="none">{t.goals.noCategory}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="border-border bg-card text-foreground px-2 shrink-0 h-7"
            onClick={() => setIsCreatingCategory(true)}
            title={t.goals.categoryLabel}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-border bg-card text-foreground px-2 shrink-0 h-7"
            onClick={() => setIsManagingCategories(true)}
            title={t.goals.categoryLabel}
          >
            <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
