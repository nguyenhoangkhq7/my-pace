"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Logout03Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, normalizeAuthSession } from "@/features/auth/store/auth.store";
import { syncTimezoneCookie } from "@/features/auth/actions/auth.action";
import { fetchClient } from "@/lib/fetchClient";
import { AppAlert } from "@/components/feedback/app-alert";
import { cn } from "@/lib/utils";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";
import { DialogFooter } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormValues } from "../schema/profile.schema";
import { useQueryClient } from "@tanstack/react-query";

const TIMEZONES = [
  { value: "Asia/Ho_Chi_Minh",    label: "🇻🇳 Hà Nội / Hồ Chí Minh (UTC+7)" },
  { value: "Asia/Bangkok",        label: "🇹🇭 Bangkok (UTC+7)" },
  { value: "Asia/Singapore",      label: "🇸🇬 Singapore (UTC+8)" },
  { value: "Asia/Shanghai",       label: "🇨🇳 Bắc Kinh / Thượng Hải (UTC+8)" },
  { value: "Asia/Tokyo",          label: "🇯🇵 Tokyo (UTC+9)" },
  { value: "Asia/Seoul",          label: "🇰🇷 Seoul (UTC+9)" },
  { value: "Asia/Kolkata",        label: "🇮🇳 Mumbai / New Delhi (UTC+5:30)" },
  { value: "Asia/Dubai",          label: "🇦🇪 Dubai (UTC+4)" },
  { value: "Europe/London",       label: "🇬🇧 London (UTC+0/+1)" },
  { value: "Europe/Paris",        label: "🇫🇷 Paris / Berlin (UTC+1/+2)" },
  { value: "Europe/Moscow",       label: "🇷🇺 Moscow (UTC+3)" },
  { value: "America/New_York",    label: "🇺🇸 New York (UTC-5/-4)" },
  { value: "America/Chicago",     label: "🇺🇸 Chicago (UTC-6/-5)" },
  { value: "America/Denver",      label: "🇺🇸 Denver (UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "🇺🇸 Los Angeles (UTC-8/-7)" },
  { value: "America/Sao_Paulo",   label: "🇧🇷 São Paulo (UTC-3)" },
  { value: "Australia/Sydney",    label: "🇦🇺 Sydney (UTC+10/+11)" },
  { value: "Pacific/Auckland",    label: "🇳🇿 Auckland (UTC+12/+13)" },
  { value: "UTC",                 label: "🌍 UTC (UTC+0)" },
];

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
  const queryClient = useQueryClient();

  const [buffer, setBuffer] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      fullName: user?.name || (user as unknown as Record<string, string>)?.fullName || "",
      wakeTime: user?.wakeTime ? user.wakeTime.substring(0, 5) : "07:00",
      sleepTime: user?.sleepTime ? user.sleepTime.substring(0, 5) : "23:00",
      timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh",
    }
  });

  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;

        const populateForm = (u: typeof user) => {
          if (!u) return;
          const initialName = u.name || (u as unknown as Record<string, string>).fullName || "";
          reset({
            fullName: initialName,
            wakeTime: u.wakeTime ? u.wakeTime.substring(0, 5) : "07:00",
            sleepTime: u.sleepTime ? u.sleepTime.substring(0, 5) : "23:00",
            timezone: u.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh",
          });
          setBuffer(u.bufferPct ?? 20);
          setError(null);
          void trigger();
        };

        populateForm(user);

        fetchClient.get<unknown>("auth/refresh")
          .then((res) => {
            if (isMounted && res.data) {
              const session = normalizeAuthSession(res.data);
              if (session) {
                setSession(session);
                populateForm(session.user);
              }
            }
          })
          .catch(() => {});
      }
    } else {
      hasInitializedRef.current = false;
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, reset, trigger, setSession, user]);

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null);

    const payload = {
      fullName: data.fullName,
      wakeTime: `${data.wakeTime}:00`,
      sleepTime: `${data.sleepTime}:00`,
      bufferPct: buffer,
      timezone: data.timezone,
    };

    try {
      const response = await fetchClient.put("users/profile", payload);
      const responseData = response.data as { timezone?: string; name?: string; fullName?: string };
      
      // Sync timezone to Server Component's cookies
      const tzToSync = responseData.timezone || payload.timezone;
      if (tzToSync) {
        await syncTimezoneCookie(tzToSync);
      }
      
      const updatedUser = {
        id: user?.id ?? "",
        name: data.fullName,
        email: user?.email ?? "",
        role: user?.role,
        wakeTime: payload.wakeTime,
        sleepTime: payload.sleepTime,
        bufferPct: payload.bufferPct,
        timezone: payload.timezone,
      };

      setSession({ user: updatedUser });
      
      // Invalidate queries to update UI in real-time
      queryClient.invalidateQueries({ queryKey: ["availableTime"] });
      queryClient.invalidateQueries({ queryKey: ["dailyPlan"] });

      onSuccess();
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

        {/* Timezone */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <HugeiconsIcon icon={Location01Icon} size={14} className="text-sky-400" />
            {t.profile.timezone}
          </Label>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <select
                value={field.value || "Asia/Ho_Chi_Minh"}
                onChange={(e) => field.onChange(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-10 rounded-xl bg-muted/20 border border-border/40 focus:border-primary text-xs text-foreground px-3 cursor-pointer appearance-none outline-none font-medium"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "12px",
                  paddingRight: "32px"
                }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-popover text-popover-foreground py-1">
                    {tz.label}
                  </option>
                ))}
                {/* Fallback: nếu timezone của user không có trong list, vẫn hiển thị được */}
                {field.value && !TIMEZONES.find((tz) => tz.value === field.value) && (
                  <option value={field.value} className="bg-popover text-popover-foreground py-1">{field.value}</option>
                )}
              </select>
            )}
          />
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
          onClick={onLogoutClick}
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
