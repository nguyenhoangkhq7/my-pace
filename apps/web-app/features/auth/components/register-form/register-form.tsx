"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { OtpEmailStep } from "./otp-email-step";
import { OtpVerificationStep } from "./otp-verification-step";
import { OtpUserDataStep } from "./otp-user-data-step";

const steps = [
    {
        id: 1,
        title: "Email",
    },
    {
        id: 2,
        title: "Verification",
    },
    {
        id: 3,
        title: "Profile",
    },
];

function RegisterProgress({ step }: { step: number }) {
    const progress = Math.min(100, ((step - 1) / (steps.length - 1)) * 100);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                {steps.map((item) => {
                    const isActive = step === item.id;
                    const isCompleted = step > item.id;

                    return (
                        <div
                            key={item.id}
                            className="flex flex-col items-center gap-3 text-center"
                        >
                            <div
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                                    isCompleted &&
                                        "border-transparent bg-emerald-500/20 text-emerald-200",
                                    isActive &&
                                        "border-transparent bg-pace-accent text-slate-950",
                                    !isActive &&
                                        !isCompleted &&
                                        "border-transparent bg-slate-800 text-slate-400"
                                )}
                            >
                                {isCompleted ? "✓" : item.id}
                            </div>

                            <div className="space-y-1">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        isActive || isCompleted
                                            ? "text-slate-100"
                                            : "text-slate-400"
                                    )}
                                >
                                    {item.title}
                                </p>

                                <p className="text-xs text-slate-400">
                                    {item.id === 1
                                        ? "Enter email"
                                        : item.id === 2
                                            ? "Verify code"
                                            : "Create profile"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full rounded-full bg-pace-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export function RegisterForm() {
    const [step, setStep] = useState(1);

    return (
        <Card className="w-full min-h-136 overflow-hidden rounded-3xl border-none shadow-2xl">
            <div className="space-y-8 p-6 sm:p-8 lg:p-10">
                <RegisterProgress step={step} />

                <div>
                    {step === 1 && (
                        <OtpEmailStep onNext={() => setStep(2)} />
                    )}

                    {step === 2 && (
                        <OtpVerificationStep onNext={() => setStep(3)} />
                    )}

                    {step === 3 && (
                        <OtpUserDataStep />
                    )}
                </div>
            </div>
        </Card>
    );
}