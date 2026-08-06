"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AppAlert } from "@/components/feedback/app-alert";
import { appToast } from "@/components/feedback/app-toast";
import { useTranslation } from "@/hooks/use-translation";
import { resetPasswordSchema, ResetPasswordValues } from "../../schema/auth.schema";
import { resetPasswordAction } from "../../actions/auth.action";

interface ForgotPasswordResetStepProps {
  email: string;
  onBackToEmail: () => void;
}

export function ForgotPasswordResetStep({ email, onBackToEmail }: ForgotPasswordResetStepProps) {
  const { t } = useTranslation();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    const result = await resetPasswordAction({
      email: data.email,
      otp: data.otp,
      newPassword: data.password,
    });

    if (!result.success) {
      form.setError("root", {
        message: result.error || "Đặt lại mật khẩu thất bại",
      });
      return;
    }

    appToast.success(t.auth.resetPasswordSuccess, {
      description: t.auth.resetPasswordSuccessDesc,
    });

    window.location.assign("/login");
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.auth.resetPasswordTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.auth.resetPasswordDesc}
        </p>
      </div>

      <FieldGroup className="space-y-4">
        <Field className="space-y-2">
          <FieldLabel htmlFor="otp">{t.auth.verificationCode}</FieldLabel>
          <Input
            {...form.register("otp")}
            id="otp"
            maxLength={6}
            placeholder="000000"
            className="h-11 text-center text-lg tracking-widest"
          />
          <FieldError>{form.formState.errors.otp?.message}</FieldError>
        </Field>

        <Field className="space-y-2">
          <FieldLabel htmlFor="password">{t.auth.newPasswordLabel}</FieldLabel>
          <Input
            {...form.register("password")}
            id="password"
            type="password"
            placeholder={t.auth.newPasswordPlaceholder}
            className="h-11"
          />
          <FieldError>{form.formState.errors.password?.message}</FieldError>
        </Field>

        <Field className="space-y-2">
          <FieldLabel htmlFor="confirmPassword">{t.auth.confirmNewPasswordLabel}</FieldLabel>
          <Input
            {...form.register("confirmPassword")}
            id="confirmPassword"
            type="password"
            placeholder={t.auth.confirmNewPasswordPlaceholder}
            className="h-11"
          />
          <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
        </Field>
      </FieldGroup>

      {form.formState.errors.root && (
        <AppAlert
          variant="error"
          title={t.auth.loginError}
          description={form.formState.errors.root.message}
        />
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t.auth.verifying : t.auth.resetPasswordBtn}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBackToEmail}
          className="h-10 text-sm text-muted-foreground"
        >
          {t.auth.tryAnotherEmail}
        </Button>
      </div>
    </form>
  );
}
