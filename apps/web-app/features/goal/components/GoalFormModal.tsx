"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Goal, GoalCreateRequest, GoalUpdateRequest, GoalType } from "../types";
import { useGoalStore } from "../store/goal.store";
import { useBoardStore } from "@/features/board/store/board.store";
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
import { Settings01Icon, Delete01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { ManageCategoriesModal } from "@/features/board/components/ManageCategoriesModal";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = ["#64748b", "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

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
  timeBoxedGoal: {
    targetMinutes: number;
    periodDays: number;
  };
  milestoneGoal: {
    targetCount: number;
  };
}

export function GoalFormModal({ isOpen, onOpenChange, goal, prefilledParentGoalId, onSuccess }: GoalFormModalProps) {
  const { createGoal, updateGoal, deleteGoal, goals } = useGoalStore();
  const { categories, createCategory } = useBoardStore();
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  const { register, handleSubmit, watch, reset, setValue, control } = useForm<FormValues>({
    defaultValues: {
      title: "",
      goalType: "Time-boxed",
      status: "Freeze",
      categoryId: "none",
      parentGoalId: "none",
      startDate: "",
      endDate: "",
      timeBoxedGoal: {
        targetMinutes: 60,
        periodDays: 7,
      },
      milestoneGoal: { targetCount: 10 },
    },
  });

  const goalType = watch("goalType");
  const status = watch("status");
  const categoryId = watch("categoryId");
  const parentGoalId = watch("parentGoalId");

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        reset({
          title: goal.title,
          goalType: goal.goalType,
          status: goal.status,
          categoryId: goal.categoryId || "none",
          parentGoalId: goal.parentGoalId || "none",
          startDate: goal.startDate || "",
          endDate: goal.endDate || "",
          timeBoxedGoal: goal.timeBoxedGoal || { targetMinutes: 60, periodDays: 7 },
          milestoneGoal: goal.milestoneGoal || { targetCount: 10 },
        });
      } else {
        reset({
          title: "",
          goalType: prefilledParentGoalId ? "Binary" : "Time-boxed",
          status: "Freeze",
          categoryId: categories.length > 0 ? categories[0].id : "none",
          parentGoalId: prefilledParentGoalId || "none",
          startDate: "",
          endDate: "",
          timeBoxedGoal: { targetMinutes: 60, periodDays: 7 },
          milestoneGoal: { targetCount: 10 },
        });
      }
      setIsCreatingCategory(false);
      setNewCategoryName("");
      setNewCategoryColor(CATEGORY_COLORS[0]);
    }
  }, [isOpen, goal, reset, categories, prefilledParentGoalId]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.categoryId === "none") {
        alert("Vui lòng chọn Category cho Goal.");
        return;
      }

      const payload: any = {
        title: data.title,
        goalType: data.goalType,
        status: data.status,
        categoryId: data.categoryId,
        parentGoalId: data.parentGoalId === "none" ? undefined : data.parentGoalId,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
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
        result = await updateGoal(goal.id, payload as GoalUpdateRequest);
      } else {
        result = await createGoal(payload as GoalCreateRequest);
      }
      if (onSuccess) {
        onSuccess(result);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;
    if (confirm("Are you sure you want to delete/archive this goal?")) {
      try {
        await deleteGoal(goal.id);
        onOpenChange(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName, color: newCategoryColor });
      setValue("categoryId", cat.id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  const binaryGoals = goals.filter(g => g.goalType === 'Binary' && g.id !== goal?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "New Goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input {...register("title", { required: true })} placeholder="Ví dụ: Học tiếng Anh" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            {isCreatingCategory ? (
              <div className="space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-md">
                <Input 
                  autoFocus
                  placeholder="Category Name" 
                  value={newCategoryName} 
                  onChange={e => setNewCategoryName(e.target.value)} 
                  className="bg-slate-950 border-slate-800 h-9"
                />
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_COLORS.map(c => (
                    <div 
                      key={c} 
                      onClick={() => setNewCategoryColor(c)}
                      className={cn("w-5 h-5 rounded-full cursor-pointer ring-offset-slate-900", newCategoryColor === c ? "ring-2 ring-white" : "")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex space-x-2 pt-1">
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 flex-1 px-2" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
                  <Button type="button" size="sm" className="h-7 text-xs bg-primary text-white flex-1 px-2" onClick={handleCreateCategory}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <Select
                  value={categoryId}
                  onValueChange={(val: string) => setValue("categoryId", val)}
                >
                  <SelectTrigger className="w-full bg-slate-900 border-slate-800">
                    <SelectValue placeholder="Chọn Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <SelectItem value="none">Không có Category</SelectItem>
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
                <Button type="button" variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-2 shrink-0 h-7" onClick={() => setIsCreatingCategory(true)} title="Thêm Category">
                  <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
                </Button>
                <Button type="button" variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-2 shrink-0 h-7" onClick={() => setIsManagingCategories(true)} title="Quản lý Category">
                  <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

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

          {goalType === "Binary" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày bắt đầu</label>
                <Input type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày kết thúc</label>
                <Input type="date" {...register("endDate")} />
              </div>
            </div>
          )}

          {!goal && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Controller
                name="goalType"
                control={control}
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!!goal}>
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Chọn loại mục tiêu" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                        <SelectItem value="Binary">Project</SelectItem>
                        <SelectItem value="Time-boxed">Habit</SelectItem>
                        <SelectItem value="Milestone">Target</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-400 mt-1 h-8">
                      {field.value === 'Binary' && 'A project with a deadline. Progress is tracked by % of completed tasks.'}
                      {field.value === 'Time-boxed' && 'A habit to maintain. Measured by accumulated minutes over a period.'}
                      {field.value === 'Milestone' && 'A countable target (e.g. Run 100km, Make 50 calls).'}
                    </p>
                  </>
                )}
              />
            </div>
          )}

          {goalType === "Time-boxed" && (
            <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/20 pl-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target (minutes)</label>
                <Input type="number" {...register("timeBoxedGoal.targetMinutes")} min="1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period (days)</label>
                <Input type="number" {...register("timeBoxedGoal.periodDays")} min="1" />
              </div>
            </div>
          )}

          {goalType === "Milestone" && (
            <div className="space-y-2 border-l-2 border-primary/20 pl-4 py-2">
              <label className="text-sm font-medium">Target count</label>
              <Input type="number" {...register("milestoneGoal.targetCount")} min="1" />
            </div>
          )}

          <div className="flex justify-between items-center pt-4 w-full">
            <div>
              {goal && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteGoal}
                  className="text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 font-medium gap-1 px-2 h-9"
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
      </DialogContent>
      <ManageCategoriesModal isOpen={isManagingCategories} onClose={() => setIsManagingCategories(false)} />
    </Dialog>
  );
}
