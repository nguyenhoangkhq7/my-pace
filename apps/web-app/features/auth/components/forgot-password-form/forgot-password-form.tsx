"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordEmailStep } from "./forgot-password-email-step";
import { ForgotPasswordResetStep } from "./forgot-password-reset-step";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");

  const handleEmailSubmitted = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep(2);
  };

  return (
    <Card className="w-full min-h-136 overflow-hidden rounded-3xl border-none shadow-2xl">
      <CardContent className="p-6 sm:p-8 lg:p-10">
        {step === 1 ? (
          <ForgotPasswordEmailStep onNext={handleEmailSubmitted} />
        ) : (
          <ForgotPasswordResetStep
            email={email}
            onBackToEmail={() => setStep(1)}
          />
        )}
      </CardContent>
    </Card>
  );
}
