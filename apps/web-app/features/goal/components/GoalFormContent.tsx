"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { Goal, GoalCreateRequest, GoalUpdateRequest, GoalType } from "../types";
import { useGoalStore } from "../store/goal.store";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { ManageCategoriesModal } from "@/features/board/components/ManageCategoriesModal";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import {
  GoalDateRangeFields,
  HabitGoalFields,
} from "./GoalFormFields";

import { GoalFormCategoryFields } from "./GoalFormCategoryFields";
import { GoalFormTypeSelect } from "./GoalFormTypeSelect";
import { useTranslation } from "@/hooks/use-translation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GoalFormContentProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSuccess?: (goal: Goal) => void;
}

interface FormValues {
  title: string;
  goalType: GoalType;
  status: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  autoCreateTask: boolean;
  durationMinutes: number;
  daysOfWeek: string;
  preferTime: string;
}

export function GoalFormContent({ isOpen, onOpenChange, goal, onSuccess }: GoalFormContentProps) {
  const { t } = useTranslation();
  const { createGoal, updateGoal, deleteGoal } = useGoalStore();
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const hasInitializedRef = useRef(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      title: "", goalType: "Time-boxed", status: "In Progress", categoryId: "none",
      startDate: "", endDate: "", autoCreateTask: true, durationMinutes: 30,
      daysOfWeek: "1,2,3,4,5,6,7", preferTime: "",
    },
  });

  const { register, handleSubmit, reset, setValue, control } = methods;
  const goalType = useWatch({ control, name: "goalType" });
  const status = useWatch({ control, name: "status" });
  const categoryId = useWatch({ control, name: "categoryId" });

  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        if (goal) {
          reset({
            title: goal.title, goalType: goal.goalType, status: goal.status,
            categoryId: goal.categoryId || "none", startDate: goal.startDate || "",
            endDate: goal.endDate || "", autoCreateTask: goal.autoCreateTask ?? false,
            durationMinutes: goal.durationMinutes || 30, daysOfWeek: goal.daysOfWeek || "1,2,3,4,5,6,7",
            preferTime: goal.preferTime || "",
          });
        } else {
          reset({
            title: "", goalType: "Time-boxed", status: "In Progress", categoryId: "none",
            startDate: "", endDate: "", autoCreateTask: true, durationMinutes: 30,
            daysOfWeek: "1,2,3,4,5,6,7", preferTime: "",
          });
        }
        hasInitializedRef.current = true;
      }
      Promise.resolve().then(() => setIsCreatingCategory(false));
    } else {
      hasInitializedRef.current = false;
    }
  }, [isOpen, goal, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.categoryId === "none") { alert(t.goals.categorySelectRequired); return; }

      const payload: any = {
        title: data.title, goalType: data.goalType, status: data.status,
        categoryId: data.categoryId, startDate: data.startDate || undefined,
        endDate: data.endDate || undefined, autoCreateTask: data.autoCreateTask ?? false,
      };

      if (data.goalType === "Time-boxed") {
        payload.durationMinutes = Number(data.durationMinutes);
        payload.daysOfWeek = data.daysOfWeek;
        payload.preferTime = data.preferTime || null;
      }

      const result = goal 
        ? await updateGoal(goal.id, payload as GoalUpdateRequest)
        : await createGoal(payload as GoalCreateRequest);
      
      if (onSuccess) onSuccess(result);
      onOpenChange(false);
    } catch (err) { console.error(err); }
  };

  const handleConfirmDelete = async () => {
    if (!goal) return;
    try {
      await deleteGoal(goal.id);
      setIsConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch (err) { console.error(err); setIsConfirmDeleteOpen(false); }
  };

  return (
    <>
      <DialogContent className={`bg-background border-border shadow-2xl p-6 gap-0 ${goalType === "Time-boxed" ? "sm:max-w-[750px]" : "sm:max-w-[500px]"} transition-all duration-300`}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-lg font-semibold">{goal ? t.goals.editGoal : t.goals.newGoal}</DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.goals.titleLabel}</label>
              <Input {...register("title", { required: true })} placeholder={t.goals.titlePlaceholder} className="h-9" />
            </div>

            <div className={`grid grid-cols-1 gap-6 ${goalType === "Time-boxed" ? "sm:grid-cols-2" : ""}`}>
              <div className="space-y-4">
                <GoalFormCategoryFields
                  categoryId={categoryId} setCategoryId={(val) => setValue("categoryId", val)}
                  isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory}
                  setIsManagingCategories={setIsManagingCategories}
                />
                {!goal && <GoalFormTypeSelect control={control} disabled={!!goal} />}
                
                {goal && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t.goals.statusLabel}</label>
                    <Select value={status} onValueChange={(val: string) => setValue("status", val)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Freeze">{t.goals.freeze}</SelectItem>
                        <SelectItem value="In Progress">{t.goals.inProgress}</SelectItem>
                        <SelectItem value="Done">{t.goals.done}</SelectItem>
                        <SelectItem value="Archived">{t.goals.archived}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {goalType === "Binary" && <GoalDateRangeFields />}
                {goalType === "Time-boxed" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t.goals.durationLabel}</label>
                    <Input type="number" {...register("durationMinutes")} min="1" placeholder="30" className="h-9" />
                  </div>
                )}
              </div>
              {goalType === "Time-boxed" && <div className="space-y-4"><HabitGoalFields /></div>}
            </div>

            <div className="flex justify-between items-center pt-4 mt-2 border-t border-border/40 w-full">
              <div className="flex items-center gap-2">
                {goal && (
                  <Button type="button" variant="ghost" onClick={() => setIsConfirmDeleteOpen(true)} className="text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 font-medium gap-1 px-2 h-9 cursor-pointer">
                    <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button type="submit" className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-colors">{t.common.save}</Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>

      <ManageCategoriesModal isOpen={isManagingCategories} onClose={() => setIsManagingCategories(false)} />
      <ConfirmDeleteDialog isOpen={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen} onConfirm={handleConfirmDelete} title={t.goals.confirmDeleteTitle} description={t.goals.confirmDeleteDesc} />
    </>
  );
}
