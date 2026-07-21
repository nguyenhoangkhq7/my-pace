"use client";

import { useState } from "react";
import { useAuthStore, normalizeAuthSession } from "../store/auth.store";
import { loginAction, registerAction, logoutAction } from "../actions/auth.action";
import { LoginValues, RegisterValues } from "../schema/auth.schema";
import { appToast } from "@/components/feedback/app-toast";
import { useTranslation } from "@/hooks/use-translation";

export function useAuth() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const result = await loginAction(data);
      if (!result.success || !result.user) {
        return { success: false, error: result.error || "Login failed" };
      }

      const session = normalizeAuthSession({ user: result.user });
      if (session) {
        setSession(session);
      }

      appToast.success(t.auth.loginSuccess, {
        description: t.auth.loginSuccessDesc,
      });

      window.location.href = "/";
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cannot connect to server",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Omit<RegisterValues, "confirmPassword">) => {
    setIsLoading(true);
    try {
      const result = await registerAction(data);
      if (!result.success || !result.user) {
        return { success: false, error: result.error || "Registration failed" };
      }

      const session = normalizeAuthSession({ user: result.user });
      if (session) {
        setSession(session);
      }

      appToast.success(t.auth.registerSuccess, {
        description: t.auth.registerSuccessDesc,
      });

      window.location.href = "/";
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cannot connect to server",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutAction();
    } catch (err) {
      console.error("Logout failed at backend", err);
    } finally {
      clearSession();
      window.location.href = "/login";
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
  };
}
