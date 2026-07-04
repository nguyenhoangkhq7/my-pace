"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, Clock01Icon, Logout03Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { post, put } from "@/lib/fetchClient";
import { AppAlert } from "@/components/feedback/app-alert";
import { cn } from "@/lib/utils";

interface ProfileFormValues {
  fullName: string;
  wakeTime: string;
  sleepTime: string;
}

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [buffer, setBuffer] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);

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
      setIsConfirmLogoutOpen(false);
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: data.fullName,
      wakeTime: `${data.wakeTime}:00`,
      sleepTime: `${data.sleepTime}:00`,
      bufferPct: buffer,
    };

    try {
      const response = await put<any, typeof payload>("users/profile", payload);
      if (response.data && "id" in response.data) {
        if (accessToken && user) {
          setSession({
            accessToken,
            user: {
              ...user,
              name: data.fullName,
              wakeTime: `${data.wakeTime}:00`,
              sleepTime: `${data.sleepTime}:00`,
              bufferPct: buffer,
            },
          });
        }
        onOpenChange(false);
      } else {
        setError("Không thể lưu thông tin. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Đã xảy ra lỗi kết nối với máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await post("auth/logout", {});
    } catch (err) {
      console.error("Logout failed at backend", err);
    } finally {
      clearSession();
      window.location.href = "/login";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-w-lg rounded-3xl p-6 border-none bg-card shadow-2xl overflow-hidden duration-300">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} className="text-primary" size={24} />
              Cập nhật thông tin cá nhân
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Thiết lập các thông số sinh hoạt cơ bản để MyPACE tính toán quỹ thời gian cho bạn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-3">
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground">Họ và tên</Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    placeholder="Nhập họ và tên..."
                    className={cn(
                      "h-10 rounded-xl bg-muted/20 border-border/40 focus:border-primary px-3 text-xs",
                      errors.fullName && "border-rose-500 focus:border-rose-500"
                    )}
                    {...register("fullName", { required: "Họ và tên không được để trống" })}
                  />
                </div>
                {errors.fullName && (
                  <span className="text-[10px] text-rose-500 font-medium pl-1">{errors.fullName.message}</span>
                )}
              </div>

              {/* Time Boundary (Wake up & Sleep) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wakeTime" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-emerald-500" />
                    Giờ thức dậy
                  </Label>
                  <Input
                    id="wakeTime"
                    type="time"
                    className="h-10 rounded-xl bg-muted/20 border-border/40 focus:border-primary px-3 text-xs"
                    {...register("wakeTime", { required: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sleepTime" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-indigo-400" />
                    Giờ đi ngủ
                  </Label>
                  <Input
                    id="sleepTime"
                    type="time"
                    className="h-10 rounded-xl bg-muted/20 border-border/40 focus:border-primary px-3 text-xs"
                    {...register("sleepTime", { required: true })}
                  />
                </div>
              </div>

              {/* Available Buffer Slider */}
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-muted-foreground">Tỉ lệ thời gian dự phòng (Buffer)</Label>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{buffer}%</span>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground/80">
                  Thời gian đệm để chuẩn bị hoặc nghỉ ngơi giữa các Task (MyPACE khuyên dùng 20% để giữ nhịp độ thoải mái nhất).
                </p>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[10, 15, 20, 25, 30].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBuffer(opt)}
                      className={cn(
                        "h-8 rounded-xl text-xs font-semibold border transition-all active:scale-[0.96]",
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

            <DialogFooter className="flex flex-row justify-between sm:justify-between items-center pt-4 border-t border-border/40">
              {/* Left side: Logout Button */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConfirmLogoutOpen(true)}
                className="h-10 px-3 rounded-xl font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <HugeiconsIcon icon={Logout03Icon} size={18} className="shrink-0" />
                <span>Đăng xuất</span>
              </Button>

              {/* Right side: Cancel & Save */}
              <div className="flex items-center gap-3">
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
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dedicated Confirmation Dialog */}
      <Dialog open={isConfirmLogoutOpen} onOpenChange={setIsConfirmLogoutOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[320px] max-w-xs rounded-3xl p-6 border-none bg-card shadow-2xl text-center">
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
              <HugeiconsIcon icon={Logout03Icon} size={24} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground text-center">
                Đăng xuất tài khoản
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-center">
                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống MyPACE?
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-center gap-3 pt-4 border-t border-border/40 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirmLogoutOpen(false)}
              className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground flex-1"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              className="h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white flex-1 transition-all active:scale-[0.97]"
            >
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
