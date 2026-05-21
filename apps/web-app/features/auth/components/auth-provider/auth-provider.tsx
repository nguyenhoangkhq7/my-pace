"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore, normalizeAuthSession } from "@/features/auth/store/auth.store";
import { get } from "@/lib/fetchClient";

export function AuthProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const setSession = useAuthStore((state) => state.setSession);
    const clearSession = useAuthStore((state) => state.clearSession);
    const accessToken = useAuthStore((state) => state.accessToken);
    const user = useAuthStore((state) => state.user);
    const isInitialized = useAuthStore((state) => state.isInitialized);

    useEffect(() => {
        let isMounted = true;

        const hydrateAuth = async () => {
            try {
                const response = await get<unknown>("auth/refresh");
                const session = normalizeAuthSession(response.data);
                if (!isMounted) {
                    return;
                }
                if (session) {
                    setSession(session);
                } else {
                    clearSession();
                }
            } catch {
                if (isMounted) {
                    clearSession();
                }
            }
        };

        void hydrateAuth();

        return () => {
            isMounted = false;
        };
    }, [clearSession, setSession]);

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        const isAuthRoute = pathname === "/login" || pathname === "/register";
        const hasSession = Boolean(accessToken && user);

        if (isAuthRoute && hasSession) {
            router.replace("/");
            return;
        }

        if (!isAuthRoute && !hasSession) {
            router.replace("/login");
        }
    }, [accessToken, isInitialized, pathname, router, user]);

    if (!isInitialized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-pace-bg">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-pace-accent" />
            </div>
        );
    }

    return <>{children}</>;
}


