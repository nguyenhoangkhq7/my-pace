import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { CategoryCreateForm } from "./CategoryCreateForm";
import type { Category } from "../types";
import { Goal } from "@/features/goal/types";
import { ManageCategoriesModal } from "./ManageCategoriesModal";
import { useTranslation } from "@/hooks/use-translation";

interface TaskFormCategoryProps {
  categoryId?: string;
  onCategoryChange: (val: string | undefined) => void;
  categories: Category[];
  goalId?: string;
  associatedGoal?: Goal;
}

export function TaskFormCategory({ categoryId, onCategoryChange, categories, goalId, associatedGoal }: TaskFormCategoryProps) {
  const { t } = useTranslation();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);

  const handleCategoryCreateSuccess = (catId: string) => {
    onCategoryChange(catId);
    setIsCreatingCategory(false);
  };

  return (
    <>
      <div className="grid gap-2">
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
              disabled={!!goalId && goalId !== "none"}
            >
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue placeholder={t.taskForm.selectCategory} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                <SelectItem value="none">{t.taskForm.noCategory}</SelectItem>
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
            <Button 
              variant="outline" 
              className="border-border bg-card text-foreground px-2 shrink-0" 
              onClick={() => setIsCreatingCategory(true)} 
              disabled={!!goalId && goalId !== "none"} 
              title={t.taskForm.addCategory}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              className="border-border bg-card text-foreground px-2 shrink-0" 
              onClick={() => setIsManagingCategories(true)} 
              title={t.taskForm.manageCategory}
            >
              <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {associatedGoal && (
        <div className="grid gap-2 mt-4">
          <Label>{t.taskForm.goalLabel}</Label>
          <div className="p-2.5 bg-card border border-border rounded-md text-sm text-foreground font-medium">
            {associatedGoal.title}
          </div>
        </div>
      )}

      <ManageCategoriesModal isOpen={isManagingCategories} onClose={() => setIsManagingCategories(false)} />
    </>
  );
}
