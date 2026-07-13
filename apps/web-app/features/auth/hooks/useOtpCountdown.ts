import { useState, useEffect, useCallback } from "react";
import { appToast } from "@/components/feedback/app-toast";

export function useOtpCountdown(initialSeconds = 60) {
  const [timeLeft, setTimeLeft] = useState(0);

  const startCountdown = useCallback(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResend = useCallback(async (resendAction: () => Promise<void>, successMessage: string) => {
    if (timeLeft > 0) return;
    
    try {
      await resendAction();
      startCountdown();
      appToast.success(successMessage);
    } catch (error) {
      console.error("Resend OTP failed", error);
    }
  }, [timeLeft, startCountdown]);

  return {
    timeLeft,
    isCounting: timeLeft > 0,
    startCountdown,
    handleResend,
  };
}
