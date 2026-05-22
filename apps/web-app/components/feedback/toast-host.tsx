"use client";

import { Toaster } from "sonner";

export function AppToastHost() {
    return (
        <Toaster
            theme="dark"
            position="top-right"
            expand
            closeButton
            richColors={false}
            visibleToasts={4}
            toastOptions={{
                duration: 4000,
                classNames: {
                    toast: "rounded-2xl border border-slate-800 bg-slate-950 text-slate-50 shadow-2xl shadow-slate-950/40",
                    title: "text-sm font-medium text-slate-50",
                    description: "text-sm text-slate-400",
                    loading: "border-slate-700 bg-slate-950 text-slate-50",
                    success: "border-emerald-500/30",
                    error: "border-rose-500/30",
                    info: "border-sky-500/30",
                    warning: "border-amber-500/30",
                },
            }}
        />
    );
}

