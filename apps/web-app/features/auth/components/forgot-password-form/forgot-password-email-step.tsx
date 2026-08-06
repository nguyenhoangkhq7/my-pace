"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AppAlert } from "@/components/feedback/app-alert";
import { useTranslation } from "@/hooks/use-translation";
import { emailStepSchema, EmailStepValues } from "../../schema/auth.schema";
import { requestForgotPasswordOtpAction } from "../../actions/auth.action";

interface ForgotPasswordEmailStepProps {
  onNext: (email: string) => void;
}

export function ForgotPasswordEmailStep({ onNext }: ForgotPasswordEmailStepProps) {
  const { t } = useTranslation();
  const form = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: EmailStepValues) => {
    const result = await requestForgotPasswordOtpAction(data);
    if (!result.success) {
      form.setError("root", {
        message: result.error || "Không thể gửi mã xác nhận",
      });
      return;
    }
    onNext(data.email);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.auth.forgotPasswordTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.auth.forgotPasswordDesc}
        </p>
      </div>

      <FieldGroup className="space-y-4">
        <Field className="space-y-2">
          <FieldLabel htmlFor="email">{t.auth.emailLabel}</FieldLabel>
          <Input
            {...form.register("email")}
            id="email"
            type="email"
            placeholder={t.auth.emailPlaceholder}
            className="h-11"
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>
      </FieldGroup>

      {form.formState.errors.root && (
        <AppAlert
          variant="error"
          title={t.auth.sendOtpError}
          description={form.formState.errors.root.message}
        />
      )}

      <Button
        type="submit"
        className="h-11 w-full text-base"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? t.auth.sendingOtp : t.auth.continueBtn}
      </Button>

      <div className="text-center text-sm">
        <Button variant="link" asChild className="p-0 text-muted-foreground hover:text-foreground">
          <Link href="/login">{t.auth.backToLogin}</Link>
        </Button>
      </div>
    </form>
  );
}
