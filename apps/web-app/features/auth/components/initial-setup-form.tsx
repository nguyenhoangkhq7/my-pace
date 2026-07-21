"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { updateProfileAction } from "@/features/profile";
import { useAuthStore } from "../store/auth.store";
import { appToast } from "@/components/feedback/app-toast";
import { AppAlert } from "@/components/feedback/app-alert";
import { cn } from "@/lib/utils";
import { TimeSelect } from "@/components/ui/time-select";
import { useTranslation } from "@/hooks/use-translation";
import { zodResolver } from "@hookform/resolvers/zod";
import { initialSetupSchema, InitialSetupFormValues } from "../schema/auth.schema";

export function InitialSetupForm() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);
  const [buffer, setBuffer] = useState(20); // default 20%
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<InitialSetupFormValues>({
    resolver: zodResolver(initialSetupSchema),
    defaultValues: {
      wakeTime: "07:00",
      sleepTime: "23:00",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: InitialSetupFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      wakeTime: data.wakeTime.length === 5 ? `${data.wakeTime}:00` : data.wakeTime,
      sleepTime: data.sleepTime.length === 5 ? `${data.sleepTime}:00` : data.sleepTime,
      bufferPct: buffer,
    };

    try {
      const response = await updateProfileAction(payload);

      if (response.success && user) {
        setSession({
          user: {
            ...user,
            ...payload
          },
        });
        
        appToast.success(t.auth.setupSuccess, {
          description: t.auth.setupSuccessDesc,
        });
      } else {
        setError(response.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bufferOptions = [10, 15, 20, 25, 30];

  return (
    <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-none shadow-2xl bg-card">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon
              icon={Clock01Icon}
              size={30}
              className="text-primary animate-pulse"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              {t.auth.setupTitle}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t.auth.setupDesc}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Wake Time & Sleep Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t.auth.wakeTime}</Label>
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
                <p className="text-xs text-rose-500 mt-1">{errors.wakeTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t.auth.sleepTime}</Label>
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
                <p className="text-xs text-rose-500 mt-1">{errors.sleepTime.message}</p>
              )}
            </div>
          </div>

          {/* Buffer Time selector */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center justify-between">
              <span>{t.auth.bufferTime}</span>
              <span className="text-primary font-bold text-base">{buffer}%</span>
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {bufferOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBuffer(opt)}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-semibold transition-all active:scale-95",
                    buffer === opt
                      ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {opt}%
                </button>
              ))}
            </div>
          </div>

          {/* Friendly Copy / Description Alert */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={20}
              className="text-primary shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">{t.auth.setupInfoTitle}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.auth.setupInfoDesc(buffer)}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2 pb-6">
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="h-12 w-full rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
          >
            {isSubmitting ? t.auth.savingSetup : t.auth.completeSetup}
          </Button>

          {error && (
            <AppAlert
              variant="error"
              title={t.auth.setupFailed}
              description={error}
            />
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
