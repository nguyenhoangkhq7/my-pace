"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, Clock01Icon } from "@hugeicons/core-free-icons";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { put, getApiErrorMessage } from "@/lib/fetchClient";
import { useAuthStore } from "../store/auth.store";
import { appToast } from "@/components/feedback/app-toast";
import { AppAlert } from "@/components/feedback/app-alert";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileFormValues {
  fullName: string;
  wakeTime: string;
  sleepTime: string;
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { user, accessToken, setSession } = useAuthStore();
  const [buffer, setBuffer] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProfileFormValues>({
    mode: "onChange",
  });

  // Load current user data when dialog opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setValue("fullName", user.name || "");
      setValue("wakeTime", user.wakeTime ? user.wakeTime.substring(0, 5) : "07:00");
      setValue("sleepTime", user.sleepTime ? user.sleepTime.substring(0, 5) : "23:00");
      setBuffer(user.bufferPct ?? 20);
      setError(null);
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      fullName: data.fullName,
      wakeTime: data.wakeTime.length === 5 ? `${data.wakeTime}:00` : data.wakeTime,
      sleepTime: data.sleepTime.length === 5 ? `${data.sleepTime}:00` : data.sleepTime,
      bufferPct: buffer,
    };

    try {
      const response = await put<any, typeof payload>("users/profile", payload);

      if (response.data && accessToken) {
        setSession({
          accessToken,
          user: response.data,
        });

        appToast.success("Profile updated successfully");
        onOpenChange(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const bufferOptions = [10, 15, 20, 25, 30];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-lg rounded-3xl p-6 border-none bg-slate-950 text-foreground shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2 text-center pb-2 border-b border-border/40">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} size={24} className="text-primary" />
              <span>Cập nhật thông tin cá nhân</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Thay đổi tên hiển thị, chu kỳ sinh học và thời gian buffer.
            </DialogDescription>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground uppercase">Họ và tên</Label>
              <Input
                {...register("fullName", { required: "Họ và tên không được để trống" })}
                id="fullName"
                type="text"
                placeholder="Nhập họ và tên"
                className="h-11 rounded-xl bg-muted/20 border-border/50 text-foreground"
              />
              {errors.fullName && (
                <p className="text-xs text-rose-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Wake/Sleep times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wakeTime" className="text-xs font-semibold text-muted-foreground uppercase">Giờ thức dậy</Label>
                <Input
                  {...register("wakeTime", { required: "Bắt buộc" })}
                  id="wakeTime"
                  type="time"
                  className="h-11 rounded-xl text-center bg-muted/20 border-border/50 font-mono text-sm"
                />
                {errors.wakeTime && (
                  <p className="text-xs text-rose-500 mt-1">{errors.wakeTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleepTime" className="text-xs font-semibold text-muted-foreground uppercase">Giờ đi ngủ</Label>
                <Input
                  {...register("sleepTime", { required: "Bắt buộc" })}
                  id="sleepTime"
                  type="time"
                  className="h-11 rounded-xl text-center bg-muted/20 border-border/50 font-mono text-sm"
                />
                {errors.sleepTime && (
                  <p className="text-xs text-rose-500 mt-1">{errors.sleepTime.message}</p>
                )}
              </div>
            </div>

            {/* Buffer Time */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                <span>Thời gian Buffer</span>
                <span className="text-primary font-bold text-sm">{buffer}%</span>
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {bufferOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBuffer(opt)}
                    className={cn(
                      "h-10 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                      buffer === opt
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                    )}
                  >
                    {opt}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <AppAlert
              variant="error"
              title="Cập nhật thất bại"
              description={error}
            />
          )}

          <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="h-10 px-6 rounded-xl font-semibold bg-primary text-primary-foreground"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
