"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm, useWatch, FormProvider, Controller } from "react-hook-form";
import { Goal, GoalCreateRequest, GoalUpdateRequest, GoalStatus } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient } from "@/lib/fetchClient";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { goalFormSchema, GoalFormValues } from "../schema/goal.schema";
import { cn } from "@/lib/utils";

interface GoalFormContentProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSuccess?: (goal: Goal) => void;
}

export function GoalFormContent({ isOpen, onOpenChange, goal, onSuccess }: GoalFormContentProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (data: GoalCreateRequest) => fetchClient.post('goals', data).then(r => r.data as Goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: GoalUpdateRequest }) => fetchClient.put(`goals/${id}`, data).then(r => r.data as Goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchClient.del(`goals/${id}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const hasInitializedRef = useRef(false);

  const methods = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "", goalType: "Time-boxed", status: "In Progress", categoryId: "none",
      startDate: "", endDate: "", autoCreateTask: true, durationMinutes: 30,
      daysOfWeek: "1,2,3,4,5,6,7", preferTime: "",
    },
  });

  const { register, handleSubmit, reset, control, formState } = methods;
  const goalType = useWatch({ control, name: "goalType" });

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

  const onSubmit = async (data: GoalFormValues) => {
    try {
      const payload: GoalCreateRequest & { status?: GoalStatus } = {
        title: data.title, goalType: data.goalType, status: data.status as GoalStatus,
        categoryId: data.categoryId, startDate: data.startDate || undefined,
        endDate: data.endDate || undefined, autoCreateTask: data.autoCreateTask ?? false,
      };

      if (data.goalType === "Time-boxed") {
        payload.durationMinutes = (data.durationMinutes && !Number.isNaN(data.durationMinutes)) ? Number(data.durationMinutes) : undefined;
        payload.daysOfWeek = data.daysOfWeek || undefined;
        payload.preferTime = data.preferTime || undefined;
      }

      const result = goal 
        ? await updateMutation.mutateAsync({ id: goal.id, data: payload as GoalUpdateRequest })
        : await createMutation.mutateAsync(payload as GoalCreateRequest);
      
      if (onSuccess) onSuccess(result);
      onOpenChange(false);
    } catch (err) { console.error(err); }
  };

  const handleConfirmDelete = async () => {
    if (!goal) return;
    try {
      await deleteMutation.mutateAsync(goal.id);
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
              <label className={cn("text-sm font-medium", formState.errors.title && "text-red-500")}>
                {t.goals.titleLabel}
              </label>
              <Input 
                {...register("title")} 
                placeholder={t.goals.titlePlaceholder} 
                className={cn("h-9", formState.errors.title && "border-red-500 focus-visible:ring-red-500")} 
              />
              {formState.errors.title && (
                <p className="text-red-500 text-xs">{formState.errors.title.message}</p>
              )}
            </div>

            <div className={`grid grid-cols-1 gap-6 ${goalType === "Time-boxed" ? "sm:grid-cols-2" : ""}`}>
              <div className="space-y-4">
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <GoalFormCategoryFields
                        categoryId={field.value || ""}
                        setCategoryId={field.onChange}
                        isCreatingCategory={isCreatingCategory}
                        setIsCreatingCategory={setIsCreatingCategory}
                        setIsManagingCategories={setIsManagingCategories}
                      />
                      {formState.errors.categoryId && (
                        <p className="text-red-500 text-xs">{formState.errors.categoryId.message}</p>
                      )}
                    </div>
                  )}
                />

                {!goal && <GoalFormTypeSelect control={control} disabled={!!goal} />}
                
                {goal && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t.goals.statusLabel}</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="Freeze">{t.goals.freeze}</SelectItem>
                            <SelectItem value="In Progress">{t.goals.inProgress}</SelectItem>
                            <SelectItem value="Done">{t.goals.done}</SelectItem>
                            <SelectItem value="Archived">{t.goals.archived}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
                
                {goalType === "Binary" && <GoalDateRangeFields />}
                {goalType === "Time-boxed" && (
                  <div className="space-y-1.5">
                    <label className={cn("text-sm font-medium", formState.errors.durationMinutes && "text-red-500")}>
                      {t.goals.durationLabel}
                    </label>
                    <Input 
                      type="number" 
                      {...register("durationMinutes", { valueAsNumber: true })} 
                      min="1" 
                      placeholder="30" 
                      className={cn("h-9", formState.errors.durationMinutes && "border-red-500 focus-visible:ring-red-500")} 
                    />
                    {formState.errors.durationMinutes && (
                      <p className="text-red-500 text-xs">{formState.errors.durationMinutes.message}</p>
                    )}
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
