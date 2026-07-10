"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { Goal, GoalCreateRequest, GoalUpdateRequest, GoalType } from "../types";
import { useGoalStore } from "../store/goal.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { ManageCategoriesModal } from "@/features/board/components/ManageCategoriesModal";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import {
  ProjectGoalFields,
  HabitGoalFields,
  TargetGoalFields,
  AutoTaskFields,
} from "./GoalFormFields";

// Sub-components
import { GoalFormCategoryFields } from "./GoalFormCategoryFields";
import { GoalFormTypeSelect } from "./GoalFormTypeSelect";

interface GoalFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  prefilledParentGoalId?: string;
  onSuccess?: (goal: Goal) => void;
}

interface FormValues {
  title: string;
  goalType: GoalType;
  status: string;
  categoryId: string;
  parentGoalId?: string;
  startDate: string;
  endDate: string;
  autoCreateTask: boolean;
  defaultSessionMinutes?: number;
  timeBoxedGoal: {
    targetMinutes: number;
    periodDays: number;
  };
  milestoneGoal: {
    targetCount: number;
  };
}

export function GoalFormModal({ isOpen, onOpenChange, goal, prefilledParentGoalId, onSuccess }: GoalFormModalProps) {
  const { createGoal, updateGoal, deleteGoal } = useGoalStore();
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const hasInitializedRef = useRef(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      title: "",
      goalType: "Time-boxed",
      status: "Freeze",
      categoryId: "none",
      parentGoalId: "none",
      startDate: "",
      endDate: "",
      autoCreateTask: true,
      defaultSessionMinutes: undefined,
      timeBoxedGoal: {
        targetMinutes: 60,
        periodDays: 7,
      },
      milestoneGoal: { targetCount: 10 },
    },
  });

  const { register, handleSubmit, reset, setValue, control } = methods;

  const goalType = useWatch({ control, name: "goalType" });
  const status = useWatch({ control, name: "status" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const parentGoalId = useWatch({ control, name: "parentGoalId" });

  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        if (goal) {
          reset({
            title: goal.title,
            goalType: goal.goalType,
            status: goal.status,
            categoryId: goal.categoryId || "none",
            parentGoalId: goal.parentGoalId || "none",
            startDate: goal.startDate || "",
            endDate: goal.endDate || "",
            autoCreateTask: goal.autoCreateTask ?? false,
            defaultSessionMinutes: goal.defaultSessionMinutes || undefined,
            timeBoxedGoal: goal.timeBoxedGoal || { targetMinutes: 60, periodDays: 7 },
            milestoneGoal: goal.milestoneGoal || { targetCount: 10 },
          });
        } else {
          reset({
            title: "",
            goalType: prefilledParentGoalId ? "Binary" : "Time-boxed",
            status: "Freeze",
            categoryId: "none",
            parentGoalId: prefilledParentGoalId || "none",
            startDate: "",
            endDate: "",
            autoCreateTask: true,
            defaultSessionMinutes: undefined,
            timeBoxedGoal: { targetMinutes: 60, periodDays: 7 },
            milestoneGoal: { targetCount: 10 },
          });
        }
        hasInitializedRef.current = true;
      }
      Promise.resolve().then(() => {
        setIsCreatingCategory(false);
      });
    } else {
      hasInitializedRef.current = false;
    }
  }, [isOpen, goal, reset, prefilledParentGoalId]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.categoryId === "none") {
        alert("Vui lòng chọn Category cho Goal.");
        return;
      }

      const payload: Record<string, unknown> = {
        title: data.title,
        goalType: data.goalType,
        status: data.status,
        categoryId: data.categoryId,
        parentGoalId: data.parentGoalId === "none" ? undefined : data.parentGoalId,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        autoCreateTask: data.autoCreateTask ?? false,
        defaultSessionMinutes: data.autoCreateTask && data.defaultSessionMinutes ? Number(data.defaultSessionMinutes) : null,
      };

      if (data.goalType === "Time-boxed") {
        payload.timeBoxedGoal = {
          targetMinutes: Number(data.timeBoxedGoal.targetMinutes),
          periodDays: Number(data.timeBoxedGoal.periodDays),
        };
      } else if (data.goalType === "Milestone") {
        payload.milestoneGoal = {
          targetCount: Number(data.milestoneGoal.targetCount),
        };
      }

      let result;
      if (goal) {
        result = await updateGoal(goal.id, payload as unknown as GoalUpdateRequest);
      } else {
        result = await createGoal(payload as unknown as GoalCreateRequest);
      }
      if (onSuccess) {
        onSuccess(result);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!goal) return;
    try {
      await deleteGoal(goal.id);
      setIsConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setIsConfirmDeleteOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "New Goal"}</DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input {...register("title", { required: true })} placeholder="Ví dụ: Học tiếng Anh" />
            </div>

            <GoalFormCategoryFields
              categoryId={categoryId}
              setCategoryId={(val) => setValue("categoryId", val)}
              isCreatingCategory={isCreatingCategory}
              setIsCreatingCategory={setIsCreatingCategory}
              setIsManagingCategories={setIsManagingCategories}
            />

            {/* Goal Cha (Optional) hidden from standard UI */}
            {parentGoalId !== "none" && (
               <input type="hidden" value={parentGoalId} />
            )}

            {goal && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={status}
                  onValueChange={(val: string) => setValue("status", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Freeze">Freeze</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {goalType === "Binary" && <ProjectGoalFields />}

            {!goal && <GoalFormTypeSelect control={control} disabled={!!goal} />}

            {goalType === "Time-boxed" && <HabitGoalFields />}
            {goalType === "Milestone" && <TargetGoalFields />}

            {/* Auto Create Task Config */}
            {(goalType === "Time-boxed" || goalType === "Milestone") && (
              <AutoTaskFields goalType={goalType} />
            )}

            <div className="flex justify-between items-center pt-4 w-full">
              <div>
                {goal && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    className="text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 font-medium gap-1 px-2 h-9 cursor-pointer"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                    Delete Goal
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Hủy
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
      <ManageCategoriesModal isOpen={isManagingCategories} onClose={() => setIsManagingCategories(false)} />
      
      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Xóa Mục tiêu này?"
        description="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa Mục tiêu này không?"
      />
    </Dialog>
  );
}
