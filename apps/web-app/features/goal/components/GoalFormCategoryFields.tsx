import React from "react";
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
import { useQuery } from "@tanstack/react-query";
import { getCategoriesAction } from "@/features/board/actions/category.action";
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
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategoriesAction });
  const { t } = useTranslation();

  const handleCategoryCreateSuccess = (catId: string) => {
    setCategoryId(catId);
    setIsCreatingCategory(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{t.goals.categoryLabel}</label>
      {isCreatingCategory ? (
        <CategoryCreateForm
          onCancel={() => setIsCreatingCategory(false)}
          onSuccess={handleCategoryCreateSuccess}
        />
      ) : (
        <div className="flex items-center space-x-2">
          <Select
             value={categoryId}
             onValueChange={(val: string) => setCategoryId(val)}
          >
            <SelectTrigger className="w-full bg-card border-border !h-9">
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
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer p-1 transition-colors"
            onClick={() => setIsCreatingCategory(true)}
            title={t.goals.categoryLabel}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer p-1 transition-colors"
            onClick={() => setIsManagingCategories(true)}
            title={t.goals.categoryLabel}
          >
            <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
