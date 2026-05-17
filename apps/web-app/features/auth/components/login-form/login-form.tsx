"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { appToast } from "@/components/feedback/app-toast";
import { AppAlert } from "@/components/feedback/app-alert";
import { getApiErrorMessage, post } from "@/lib/fetchClient";
import {
  normalizeAuthSession,
  useAuthStore,
} from "@/features/auth/store/auth.store";

type LoginRequest = LoginValues;

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    try {
      const response = await post<unknown, LoginRequest>("auth/login", data);
      const session = normalizeAuthSession(response.data);

      if (!session) {
        loginForm.setError("root", {
          message: "Invalid auth response from server",
        });
        return;
      }

      setSession(session);

      appToast.success("Logged in successfully", {
        description: "Redirecting you to your dashboard.",
      });

      router.replace("/");
    } catch (error: unknown) {
      loginForm.setError("root", {
        message: getApiErrorMessage(error),
      });
    }
  };

  return (
      <form onSubmit={loginForm.handleSubmit(onSubmit)}>
        <Card className="w-full min-h-136 overflow-hidden rounded-3xl border-none shadow-2xl">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-100">
              Login
            </CardTitle>

            <CardDescription className="text-base text-slate-300">
              Welcome back to my space
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <FieldGroup className="space-y-5">
              <Field className="space-y-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>

                <Input
                    {...loginForm.register("email")}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-11"
                />

                <FieldError>
                  {loginForm.formState.errors.email?.message}
                </FieldError>
              </Field>

              <Field className="space-y-2">
                <FieldLabel htmlFor="password">Password</FieldLabel>

                <Input
                    {...loginForm.register("password")}
                    id="password"
                    type="password"
                    placeholder="Enter your password"
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
              disabled={loginForm.formState.isSubmitting}
            >
              {loginForm.formState.isSubmitting ? "Signing in..." : "Login"}
            </Button>

            {loginForm.formState.errors.root && (
              <AppAlert
                variant="error"
                title="Unable to log in"
                description={loginForm.formState.errors.root.message}
              />
            )}

            <div className="flex items-center justify-center gap-1 text-sm text-slate-400">
              <span>Don&apos;t have an account?</span>

              <Button
                  variant="link"
                  className="h-auto p-0 text-sm text-slate-100 hover:text-slate-200"
                  asChild
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
  );
}