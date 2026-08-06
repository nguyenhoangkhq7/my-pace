"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { CategoryCreateForm } from "@/features/board/components/CategoryCreateForm";
import { ManageCategoriesModal } from "@/features/board/components/ManageCategoriesModal";
import { useCategories } from "@/features/board/hooks/useCategories";
import { useTranslation } from "@/hooks/use-translation";

interface FixedEventCategorySelectorProps {
  categoryId?: string;
  onCategoryChange: (value: string | undefined) => void;
}

export function FixedEventCategorySelector({ categoryId, onCategoryChange }: FixedEventCategorySelectorProps) {
  const { t } = useTranslation();
  const { categories } = useCategories();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);

  const handleCategoryCreateSuccess = (catId: string) => {
    onCategoryChange(catId);
    setIsCreatingCategory(false);
  };

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>{t.taskForm.categoryLabel}</Label>
        {isCreatingCategory ? (
          <CategoryCreateForm
            onCancel={() => setIsCreatingCategory(false)}
            onSuccess={handleCategoryCreateSuccess}
          />
        ) : (
          <div className="flex space-x-1.5">
            <Select
              value={categoryId || "none"}
              onValueChange={(val) => onCategoryChange(val === "none" ? undefined : val)}
            >
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue placeholder={t.taskForm.selectCategory} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="none">{t.taskForm.noCategory}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="border-border bg-card text-foreground px-2 shrink-0 cursor-pointer"
              onClick={() => setIsCreatingCategory(true)}
              title={t.taskForm.addCategory}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border bg-card text-foreground px-2 shrink-0 cursor-pointer"
              onClick={() => setIsManagingCategories(true)}
              title={t.taskForm.manageCategory}
            >
              <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <ManageCategoriesModal
        isOpen={isManagingCategories}
        onClose={() => setIsManagingCategories(false)}
      />
    </>
  );
}
