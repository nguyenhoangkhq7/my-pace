"use client";

import Link from "next/link";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginValues } from "../../schema/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppAlert } from "@/components/feedback/app-alert";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "@/hooks/use-translation";


export function LoginForm() {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    const result = await login(data);
    if (!result.success) {
      loginForm.setError("root", {
        message: result.error || "Login failed",
      });
    }
  };

  return (
      <form onSubmit={loginForm.handleSubmit(onSubmit)}>
        <Card className="w-full min-h-136 overflow-hidden rounded-3xl border-none shadow-2xl">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              {t.auth.loginTitle}
            </CardTitle>

            <CardDescription className="text-base text-muted-foreground">
              {t.auth.loginWelcome}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <FieldGroup className="space-y-5">
              <Field className="space-y-2">
                <FieldLabel htmlFor="email">{t.auth.emailLabel}</FieldLabel>

                <Input
                    {...loginForm.register("email")}
                    id="email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    className="h-11"
                />

                <FieldError>
                  {loginForm.formState.errors.email?.message}
                </FieldError>
              </Field>

              <Field className="space-y-2">
                <FieldLabel htmlFor="password">{t.auth.passwordLabel}</FieldLabel>

                <Input
                    {...loginForm.register("password")}
                    id="password"
                    type="password"
                    placeholder={t.auth.passwordPlaceholder}
                    className="h-11"
                />

                <FieldError>
                  {loginForm.formState.errors.password?.message}
                </FieldError>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex flex-col gap-5 pt-2">
            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={loginForm.formState.isSubmitting || isLoading}
            >
              {loginForm.formState.isSubmitting || isLoading ? t.auth.signingIn : t.auth.loginBtn}
            </Button>

            {loginForm.formState.errors.root && (
              <AppAlert
                variant="error"
                title={t.auth.loginError}
                description={loginForm.formState.errors.root.message}
              />
            )}

            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <span>{t.auth.noAccount}</span>

              <Button
                  variant="link"
                  className="h-auto p-0 text-sm text-foreground hover:text-foreground/80"
                  asChild
              >
                <Link href="/register">{t.auth.register}</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
  );
}