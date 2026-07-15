"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Logout03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { updateProfileAction, logoutAction } from "@/features/auth/actions/auth.action";
import { AppAlert } from "@/components/feedback/app-alert";
import { cn } from "@/lib/utils";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";
import { DialogFooter } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormValues } from "../schema/auth.schema";

interface ProfileFormContentProps {
  onSuccess: () => void;
  onCancel: () => void;
  onLogoutClick: () => void;
  isOpen: boolean;
}

export function ProfileFormContent({ onSuccess, onCancel, onLogoutClick, isOpen }: ProfileFormContentProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [buffer, setBuffer] = useState(20);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      wakeTime: "07:00",
      sleepTime: "23:00",
    }
  });

  useEffect(() => {
    if (user && isOpen) {
      Promise.resolve().then(() => {
        reset({
          fullName: user.name || "",
          wakeTime: user.wakeTime ? user.wakeTime.substring(0, 5) : "07:00",
          sleepTime: user.sleepTime ? user.sleepTime.substring(0, 5) : "23:00",
        });
        setBuffer(user.bufferPct ?? 20);
        setError(null);
      });
    }
  }, [user, isOpen, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null);

    const payload = {
      name: data.fullName,
      wakeTime: `${data.wakeTime}:00`,
      sleepTime: `${data.sleepTime}:00`,
      bufferPct: buffer,
    };

    try {
      const response = await updateProfileAction(payload);
      if (response.success) {
        if (user) {
          setSession({
            user: {
              ...user,
              name: data.fullName,
              wakeTime: `${data.wakeTime}:00`,
              sleepTime: `${data.sleepTime}:00`,
              bufferPct: buffer,
            },
          });
        }
        onSuccess();
      } else {
        setError(response.error || t.profile.updateError);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      const errorMessage = err instanceof Error ? err.message : t.profile.connectionError;
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-3">
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground">{t.profile.fullName}</Label>
          <div className="relative">
            <Input
              id="fullName"
              placeholder={t.profile.fullNamePlaceholder}
              className={cn(
                "h-10 rounded-xl bg-muted/20 border-border/40 focus:border-primary px-3 text-xs",
                errors.fullName && "border-rose-500 focus:border-rose-500"
              )}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <span className="text-[10px] text-rose-500 font-medium pl-1">{errors.fullName.message}</span>
          )}
        </div>

        {/* Time Boundary (Wake up & Sleep) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={Clock01Icon} size={14} className="text-emerald-500" />
              {t.profile.wakeTime}
            </Label>
            <Controller
              name="wakeTime"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.wakeTime && (
              <span className="text-[10px] text-rose-500 font-medium pl-1">{errors.wakeTime.message}</span>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={Clock01Icon} size={14} className="text-indigo-400" />
              {t.profile.sleepTime}
            </Label>
            <Controller
              name="sleepTime"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.sleepTime && (
              <span className="text-[10px] text-rose-500 font-medium pl-1">{errors.sleepTime.message}</span>
            )}
          </div>
        </div>

        {/* Available Buffer Slider */}
        <div className="space-y-2.5 pt-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-semibold text-muted-foreground">{t.profile.bufferRatio}</Label>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{buffer}%</span>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground/80">
            {t.profile.bufferDesc}
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
          title={t.profile.updateFailed}
          description={error}
        />
      )}

      <DialogFooter className="flex flex-row justify-between sm:justify-between items-center pt-4 border-t border-border/40">
        {/* Left side: Logout Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
              await logoutAction();
              onLogoutClick();
          }}
          className="h-10 px-3 rounded-xl font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <HugeiconsIcon icon={Logout03Icon} size={18} className="shrink-0" />
          <span>{t.profile.logout}</span>
        </Button>

        {/* Right side: Cancel & Save */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground"
          >
            {t.profile.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="h-10 px-6 rounded-xl font-semibold bg-primary text-primary-foreground"
          >
            {isSubmitting ? t.profile.saving : t.profile.saveChanges}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
