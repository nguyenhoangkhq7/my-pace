"use client";

import {
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";

import { post, getApiErrorMessage } from "@/lib/fetchClient";

import { useRegisterStore } from "../../store/register.store";

import {
    emailStepSchema,
    type EmailStepValues,
} from "../../schema/auth.schema";
import { AppAlert } from "@/components/feedback/app-alert";
import { appToast } from "@/components/feedback/app-toast";

interface OtpEmailStepProps {
    onNext: () => void;
}

type OtpResponse = {
    otp: string;
};

type SendOtpRequest = {
    email: string;
};

export function OtpEmailStep({
                                 onNext,
                             }: OtpEmailStepProps) {
    const setRegisterData = useRegisterStore(
        (state) => state.setRegisterData
    );

    const form = useForm<EmailStepValues>({
        resolver: zodResolver(emailStepSchema),
        defaultValues: {
            email: "",
        },
        mode: "onChange",
    });

    const onSubmit = async (
        data: EmailStepValues
    ) => {
        try {
            await post<OtpResponse, SendOtpRequest>(
                "auth/send-otp",
                {
                    email: data.email,
                }
            );

            setRegisterData({
                email: data.email,
            });

            appToast.success("Verification code sent", {
                description: "Check your inbox for the 6-digit code.",
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
            method="POST"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-col justify-between"
        >
            <div className="space-y-6">
                <CardHeader className="space-y-3 px-0 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Create account
                    </CardTitle>

                    <CardDescription className="text-base leading-relaxed text-slate-300">
                        Enter your email address to receive a
                        verification code
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 px-0">
                    <FieldGroup className="space-y-5">
                        <Field className="space-y-2">
                            <FieldLabel htmlFor="email">
                                Email address
                            </FieldLabel>

                            <Input
                                {...form.register("email")}
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                className="h-12"
                            />

                            <FieldError>
                                {form.formState.errors.email?.message}
                            </FieldError>
                        </Field>
                    </FieldGroup>

                    {form.formState.errors.root && (
                        <AppAlert
                            variant="error"
                            title="Unable to send verification code"
                            description={form.formState.errors.root.message}
                        />
                    )}
                </CardContent>
            </div>

            <CardFooter className="px-0 pt-6">
                <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="h-12 w-full text-base"
                >
                    {form.formState.isSubmitting
                        ? "Sending OTP..."
                        : "Continue"}
                </Button>
            </CardFooter>
        </form>
    );
}