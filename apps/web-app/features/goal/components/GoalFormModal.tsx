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

interface GoalFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  prefilledParentGoalId?: string;
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

export function GoalFormModal({ isOpen, onOpenChange, goal, prefilledParentGoalId }: GoalFormModalProps) {
  const { createGoal, updateGoal, goals } = useGoalStore();
  const { categories } = useBoardStore();

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

      if (goal) {
        await updateGoal(goal.id, payload as GoalUpdateRequest);
      } else {
        await createGoal(payload as GoalCreateRequest);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  const binaryGoals = goals.filter(g => g.goalType === 'Binary' && g.id !== goal?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? "Sửa Goal" : "Tạo Goal Mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên Goal</label>
            <Input {...register("title", { required: true })} placeholder="Ví dụ: Học tiếng Anh" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={categoryId}
              onValueChange={(val: string) => setValue("categoryId", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn Category" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Goal Cha (Optional) hidden from standard UI */}
          {parentGoalId !== "none" && (
             <input type="hidden" value={parentGoalId} />
          )}

          {goal && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
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
              <label className="text-sm font-medium">Loại Goal</label>
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
                        <SelectItem value="Binary">Dự án (Project)</SelectItem>
                        <SelectItem value="Time-boxed">Thói quen (Habit)</SelectItem>
                        <SelectItem value="Milestone">Mục tiêu (Target)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-400 mt-1 h-8">
                      {field.value === 'Binary' && 'Dự án có ngày kết thúc. Tiến độ dựa trên % Task đã hoàn thành.'}
                      {field.value === 'Time-boxed' && 'Thói quen cần duy trì. Đo lường bằng số phút tích lũy.'}
                      {field.value === 'Milestone' && 'Mục tiêu số lượng cần đạt (ví dụ: Chạy 100km, Gọi 50 cuộc).'}
                    </p>
                  </>
                )}
              />
            </div>
          )}

          {goalType === "Time-boxed" && (
            <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/20 pl-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mục tiêu (phút)</label>
                <Input type="number" {...register("timeBoxedGoal.targetMinutes")} min="1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chu kỳ (ngày)</label>
                <Input type="number" {...register("timeBoxedGoal.periodDays")} min="1" />
              </div>
            </div>
          )}

          {goalType === "Milestone" && (
            <div className="space-y-2 border-l-2 border-primary/20 pl-4 py-2">
              <label className="text-sm font-medium">Số lượng mục tiêu</label>
              <Input type="number" {...register("milestoneGoal.targetCount")} min="1" />
            </div>
          )}

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu Goal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
