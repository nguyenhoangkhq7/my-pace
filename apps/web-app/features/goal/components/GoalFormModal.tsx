"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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

interface GoalFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

interface FormValues {
  title: string;
  goalType: GoalType;
  status: string;
  startDate: string;
  endDate: string;
  timeBoxedGoal: {
    targetMinutes: number;
    periodDays: number;
  };
  milestones: { title: string }[];
}

export function GoalFormModal({ isOpen, onOpenChange, goal }: GoalFormModalProps) {
  const { createGoal, updateGoal } = useGoalStore();

  const { register, control, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      title: "",
      goalType: "Time-boxed",
      status: "Freeze",
      startDate: "",
      endDate: "",
      timeBoxedGoal: {
        targetMinutes: 60,
        periodDays: 7,
      },
      milestones: [{ title: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const goalType = watch("goalType");
  const status = watch("status");

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        reset({
          title: goal.title,
          goalType: goal.goalType,
          status: goal.status,
          startDate: goal.startDate || "",
          endDate: goal.endDate || "",
          timeBoxedGoal: goal.timeBoxedGoal || { targetMinutes: 60, periodDays: 7 },
          milestones: goal.milestones?.length ? goal.milestones : [{ title: "" }],
        });
      } else {
        reset({
          title: "",
          goalType: "Time-boxed",
          status: "Freeze",
          startDate: "",
          endDate: "",
          timeBoxedGoal: { targetMinutes: 60, periodDays: 7 },
          milestones: [{ title: "" }],
        });
      }
    }
  }, [isOpen, goal, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        title: data.title,
        goalType: data.goalType,
        status: data.status,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };

      if (data.goalType === "Time-boxed") {
        payload.timeBoxedGoal = {
          targetMinutes: Number(data.timeBoxedGoal.targetMinutes),
          periodDays: Number(data.timeBoxedGoal.periodDays),
        };
      } else if (data.goalType === "Milestone") {
        payload.milestones = data.milestones
          .filter((m) => m.title.trim() !== "")
          .map((m, idx) => ({
            title: m.title.trim(),
            sortOrder: idx,
            isDone: false,
          }));
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

          {!goal && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại Goal</label>
              <Select
                value={goalType}
                onValueChange={(val: GoalType) => setValue("goalType", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Time-boxed">Time-boxed (Đo bằng thời gian)</SelectItem>
                  <SelectItem value="Milestone">Milestone (Đo bằng cột mốc)</SelectItem>
                  <SelectItem value="Binary">Binary (Đạt hoặc Không)</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="space-y-3 border-l-2 border-primary/20 pl-4 py-2">
              <label className="text-sm font-medium">Các cột mốc</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`milestones.${index}.title` as const)} placeholder={`Cột mốc ${index + 1}`} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    &times;
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => append({ title: "" })}>
                + Thêm cột mốc
              </Button>
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
