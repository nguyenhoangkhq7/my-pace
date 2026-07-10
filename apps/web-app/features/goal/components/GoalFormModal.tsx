"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Goal, GoalCreateRequest, GoalUpdateRequest, GoalType } from "../types";
import { useGoalStore } from "../store/goal.store";
import { useBoardStore } from "@/features/board/store/board.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  const { categories, createCategory } = useBoardStore();
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [showAutoTaskHelp, setShowAutoTaskHelp] = useState(false);
  const hasInitializedRef = useRef(false);

  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
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

  const goalType = useWatch({ control, name: "goalType" });
  const status = useWatch({ control, name: "status" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const parentGoalId = useWatch({ control, name: "parentGoalId" });
  const autoCreateTask = useWatch({ control, name: "autoCreateTask" });

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
        setNewCategoryName("");
        setNewCategoryColor(CATEGORY_COLORS[0]);
      });
    } else {
      hasInitializedRef.current = false;
    }
  }, [isOpen, goal, reset, categories, prefilledParentGoalId]);

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

  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true);
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

          {/* Auto Create Task Config */}
          {(goalType === "Time-boxed" || goalType === "Milestone") && (
            <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoCreateTask"
                    {...register("autoCreateTask")}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-primary cursor-pointer"
                  />
                  <label htmlFor="autoCreateTask" className="text-sm font-medium cursor-pointer">
                    Tự động tạo Task hàng ngày
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAutoTaskHelp(!showAutoTaskHelp)}
                  className="w-4 h-4 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-center border border-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Xem hướng dẫn tự động tạo Task"
                >
                  ?
                </button>
              </div>

              {showAutoTaskHelp && (
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 space-y-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="font-semibold text-slate-200">💡 Cơ chế tự động tạo Task khi Check-in:</p>
                  
                  {goalType === "Time-boxed" ? (
                    <div className="space-y-2">
                      <p>Hệ thống tự tạo Task thói quen hàng ngày dựa vào thời lượng chu kỳ. Nếu bạn đã hoàn thành đủ số phút trong chu kỳ hiện tại, hệ thống sẽ dừng sinh Task.</p>
                      <ul className="list-disc pl-3.5 space-y-1 text-slate-500">
                        <li><strong className="text-slate-300">Ví dụ 1 (Chia đều):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, bỏ trống thời lượng phiên: Tạo <span className="font-medium text-slate-300">40m - 40m - 40m</span>.</li>
                        <li><strong className="text-slate-300">Ví dụ 2 (Dồn phiên):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, chọn phiên <span className="font-medium text-slate-300">60 phút</span>: Ngày 1 tạo <span className="font-medium text-slate-300">60m</span>, Ngày 2 tạo <span className="font-medium text-slate-300">60m</span>, Ngày 3 tạo <span className="font-medium text-slate-300">0m</span> (đã đạt).</li>
                        <li><strong className="text-slate-300">Ví dụ 3 (Tự bù phiên cuối):</strong> Đặt <span className="text-primary/95 font-medium">120 phút / 3 ngày</span>, chọn phiên <span className="font-medium text-slate-300">30 phút</span>: Ngày 1 tạo <span className="font-medium text-slate-300">30m</span>, Ngày 2 tạo <span className="font-medium text-slate-300">30m</span>. Ngày 3 (ngày cuối) tự động chuyển thành <span className="font-medium text-slate-300">60m</span> (120 - 30 - 30) để hoàn thành đủ chu kỳ.</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>Hệ thống sẽ tự tạo 1 Task mỗi ngày với thời lượng cố định do bạn thiết lập cho đến khi tích lũy đạt đủ số lượng của Mục tiêu (Target).</p>
                      <p className="text-slate-500"><strong className="text-slate-300">Ví dụ:</strong> Target 10 bài tập, thời lượng phiên là 45 phút. Mỗi ngày hệ thống sinh 1 task 45 phút cho tới khi hoàn thành đủ 10 bài.</p>
                    </div>
                  )}
                </div>
              )}

              {autoCreateTask && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium block">
                    {goalType === "Time-boxed" 
                      ? "Thời lượng mỗi phiên (phút) - Bỏ trống để chia đều tự động" 
                      : "Thời lượng Task hàng ngày (phút)"}
                  </label>
                  <Input 
                    type="number" 
                    {...register("defaultSessionMinutes")} 
                    placeholder={goalType === "Time-boxed" ? "Ví dụ: 60" : "Ví dụ: 45"} 
                    min="1" 
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 w-full">
            <div>
              {goal && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteClick}
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
      </DialogContent>
      <ManageCategoriesModal isOpen={isManagingCategories} onClose={() => setIsManagingCategories(false)} />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[360px] max-w-xs rounded-3xl p-6 border-none bg-slate-950 text-slate-50 border-slate-800 shadow-2xl text-center">
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
              <HugeiconsIcon icon={Delete01Icon} size={24} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground text-center">
                Xóa Mục tiêu này?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-center">
                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa Mục tiêu này không?
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-center gap-3 pt-4 border-t border-border/40 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground flex-1 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white flex-1 transition-all active:scale-[0.97] cursor-pointer"
            >
              Đồng ý xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
