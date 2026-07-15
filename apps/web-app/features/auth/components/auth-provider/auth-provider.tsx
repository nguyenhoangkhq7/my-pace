"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore, normalizeAuthSession } from "../../store/auth.store";
import { getSessionAction } from "../../actions/auth.action";

export function AuthProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const setSession = useAuthStore((state) => state.setSession);
    const clearSession = useAuthStore((state) => state.clearSession);
    const user = useAuthStore((state) => state.user);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const isAuthRoute = pathname === "/login" || pathname === "/register";
    const hasSession = Boolean(user);

    useEffect(() => {
        let isMounted = true;

        const hydrateAuth = async () => {
            try {
                const response = await getSessionAction();
                if (!isMounted) {
                    return;
                }
                if (response.success && response.user) {
                    const session = normalizeAuthSession({ user: response.user });
                    if (session) {
                        setSession(session);
                    } else {
                        clearSession();
                    }
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

        if (isAuthRoute && hasSession) {
            router.replace("/");
            return;
        }

        if (!isAuthRoute && !hasSession) {
            router.replace("/login");
        }
    }, [isInitialized, isAuthRoute, hasSession, router]);

    if (!isInitialized || (!isAuthRoute && !hasSession)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
        );
    }


    return <>{children}</>;
}


