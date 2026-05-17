"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UserCircleIcon,
    ViewIcon,
    ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { useForm } from "react-hook-form";

import { AppAlert } from "@/components/feedback/app-alert";
import { appToast } from "@/components/feedback/app-toast";
import { Button } from "@/components/ui/button";
import {
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, post } from "@/lib/fetchClient";
import {
    normalizeAuthSession,
    useAuthStore,
} from "@/features/auth/store/auth.store";
import {
    userDataStepSchema,
    type UserDataStepValues,
} from "@/features/auth/schema/auth.schema";
import { useRegisterStore } from "@/features/auth/store/register.store";

type RegisterRequest = {
    email: string;
    password: string;
    fullName: string;
};

export function OtpUserDataStep() {
    const router = useRouter();
    const setSession = useAuthStore((state) => state.setSession);
    const {
        registerFormData,
        setRegisterData,
        resetRegisterData,
    } = useRegisterStore();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<UserDataStepValues>({
        resolver: zodResolver(userDataStepSchema),
        defaultValues: {
            fullName: registerFormData.fullName || "",
            password: registerFormData.password || "",
            confirmPassword: registerFormData.confirmPassword || "",
        },
        mode: "onChange",
    });

    const onSubmit = async (data: UserDataStepValues) => {
        if (!registerFormData.email) {
            form.setError("root", {
                message: "Email is missing. Please go back and enter your email again.",
            });
            return;
        }

        setRegisterData({
            fullName: data.fullName,
            password: data.password,
            confirmPassword: data.confirmPassword,
        });

        try {
            const response = await post<unknown, RegisterRequest>("auth/register", {
                email: registerFormData.email,
                password: data.password,
                fullName: data.fullName,
            });

            const session = normalizeAuthSession(response.data);

            if (!session) {
                throw new Error("Invalid auth response from server");
            }

            setSession(session);

            appToast.success("Account created successfully", {
                description: "You are now signed in.",
            });

            resetRegisterData();
            router.replace("/");
        } catch (error: unknown) {
            form.setError("root", {
                message: getApiErrorMessage(error),
            });
        }
    };

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-col justify-between"
        >
            <div className="space-y-8">
                <CardHeader className="space-y-4 px-0 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <HugeiconsIcon
                            icon={UserCircleIcon}
                            size={30}
                            className="text-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            Create your profile
                        </CardTitle>

                        <CardDescription className="mx-auto max-w-md text-base leading-relaxed">
                            Complete your registration for:
                        </CardDescription>

                        <p className="text-sm font-medium text-foreground">
                            {registerFormData.email || "your@email.com"}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 px-0">
                    <FieldGroup className="space-y-5">
                        <Field className="space-y-2">
                            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                            <Input
                                {...form.register("fullName")}
                                id="fullName"
                                type="text"
                                placeholder="Enter your full name"
                                className="h-12 rounded-xl"
                            />
                            <FieldError>{form.formState.errors.fullName?.message}</FieldError>
                        </Field>

                        <Field className="space-y-2">
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <div className="relative">
                                <Input
                                    {...form.register("password")}
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    className="h-12 rounded-xl pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <HugeiconsIcon
                                        icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                                        size={18}
                                    />
                                </button>
                            </div>
                            <FieldError>{form.formState.errors.password?.message}</FieldError>
                        </Field>

                        <Field className="space-y-2">
                            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                            <div className="relative">
                                <Input
                                    {...form.register("confirmPassword")}
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Retype your password"
                                    className="h-12 rounded-xl pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <HugeiconsIcon
                                        icon={showConfirmPassword ? ViewOffSlashIcon : ViewIcon}
                                        size={18}
                                    />
                                </button>
                            </div>
                            <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
                        </Field>
                    </FieldGroup>
                </CardContent>
            </div>

            <CardFooter className="flex flex-col gap-5 px-0 pt-8">
                <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                    className="h-12 w-full rounded-xl text-base font-medium"
                >
                    {form.formState.isSubmitting ? "Creating account..." : "Create account"}
                </Button>

                {form.formState.errors.root && (
                    <AppAlert
                        variant="error"
                        title="Unable to create account"
                        description={form.formState.errors.root.message}
                    />
                )}

                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <span>Already have an account?</span>

                    <Button variant="link" className="h-auto p-0 text-sm font-medium" type="button" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </CardFooter>
        </form>
    );
}