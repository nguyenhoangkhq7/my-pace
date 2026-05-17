"use client";

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
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterStore } from "@/features/auth/store/register.store";
import {
    otpStepSchema,
    type OtpStepValues,
} from "@/features/auth/schema/auth.schema";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    RefreshIcon,
    Mail01Icon,
} from "@hugeicons/core-free-icons";
import { post, getApiErrorMessage } from "@/lib/fetchClient";
import { AppAlert } from "@/components/feedback/app-alert";
import { appToast } from "@/components/feedback/app-toast";

interface OtpVerificationStepProps {
    onNext: () => void;
}

type VerifyOtpRequest = {
    email: string;
    otp: string;
};

type VerifyOtpResponse = Record<string, unknown>;

export function OtpVerificationStep({onNext}: OtpVerificationStepProps) {
    const {
        registerFormData,
        setRegisterData,
    } = useRegisterStore();
    const form = useForm<OtpStepValues>({
        resolver: zodResolver(otpStepSchema),
        defaultValues: {
            otp: registerFormData.otp || "",
        },
        mode: "onChange",
    });
    const onSubmit = async (
        data: OtpStepValues
    ) => {
        if (!registerFormData.email) {
            form.setError("root", {
                message: "Email is missing. Please go back and enter your email again.",
            });
            return;
        }

        try {
            await post<VerifyOtpResponse, VerifyOtpRequest>(
                "auth/verify-otp",
                {
                    email: registerFormData.email,
                    otp: data.otp,
                }
            );

            setRegisterData({
                otp: data.otp,
            });

            appToast.success("Verification code confirmed", {
                description: "You can now finish creating your profile.",
            });

            onNext();
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
                            icon={Mail01Icon}
                            size={30}
                            className="text-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            Verify your account
                        </CardTitle>
                        <CardDescription className="mx-auto max-w-md text-base leading-relaxed text-slate-300">
                            We sent a 6-digit verification code
                            to:
                        </CardDescription>
                        <p className="text-sm font-medium text-slate-100">
                            {registerFormData.email ||
                                "your@email.com"}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8 px-0">
                    <Field className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <FieldLabel htmlFor="otp-verification">
                                Verification code
                            </FieldLabel>
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                className="gap-2 rounded-xl"
                            >
                                <HugeiconsIcon
                                    icon={RefreshIcon}
                                    size={16}
                                />
                                Resend
                            </Button>
                        </div>

                        <Controller
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={field.value}
                                        onChange={field.onChange}
                                        id="otp-verification"
                                    >
                                        <InputOTPGroup className="gap-2">
                                            <InputOTPSlot
                                                index={0}
                                                className="h-14 w-12 rounded-xl border text-lg shadow-sm transition-all focus-within:ring-2"
                                            />
                                            <InputOTPSlot
                                                index={1}
                                                className="h-14 w-12 rounded-xl border text-lg shadow-sm transition-all focus-within:ring-2"
                                            />
                                            <InputOTPSlot
                                                index={2}
                                                className="h-14 w-12 rounded-xl border text-lg shadow-sm transition-all focus-within:ring-2"
                                            />
                                        </InputOTPGroup>
                                        <InputOTPSeparator className="mx-3 text-slate-500" />
                                        <InputOTPGroup className="gap-2">
                                            <InputOTPSlot
                                                index={3}
                                                className="h-14 w-12 rounded-xl border text-lg shadow-sm transition-all focus-within:ring-2"
                                            />
                                            <InputOTPSlot
                                                index={4}
                                                className="h-14 w-12 rounded-xl border text-lg shadow-sm transition-all focus-within:ring-2"
                                            />
                                            <InputOTPSlot
                                                index={5}
                                                className="h-14 w-12 rounded-xl border text-lg shadow-sm transition-all focus-within:ring-2"
                                            />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            )}
                        />

                        <FieldError className="text-center">
                            {form.formState.errors.otp?.message}
                        </FieldError>

                        {form.formState.errors.root && (
                            <AppAlert
                                variant="error"
                                title="Unable to verify code"
                                description={form.formState.errors.root.message}
                            />
                        )}

                        <FieldDescription className="space-y-2 text-center">
                            <span className="block text-sm text-slate-400">
                                Didn&apos;t receive the code?
                            </span>

                            <button
                                type="button"
                                className="text-sm font-medium text-slate-100 hover:text-slate-200 hover:underline"
                            >
                                Try another email address
                            </button>
                        </FieldDescription>
                    </Field>
                </CardContent>
            </div>

            <CardFooter className="flex flex-col gap-4 px-0 pt-8">
                <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-base font-medium"
                    disabled={
                        form.formState.isSubmitting ||
                        !form.formState.isValid
                    }
                >
                    {form.formState.isSubmitting
                        ? "Verifying..."
                        : "Continue"}
                </Button>
            </CardFooter>
        </form>
    );
}