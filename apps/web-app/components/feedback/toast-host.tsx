"use client";

import { Toaster } from "sonner";

export function AppToastHost() {
    return (
        <Toaster
            theme="dark"
            position="bottom-left"
            expand={false}
            closeButton
            richColors={false}
            visibleToasts={3}
            gap={8}
            offset={16}
            toastOptions={{
                duration: 3500,
                classNames: {
                    toast: "rounded-xl border border-border bg-background/95 text-foreground shadow-lg shadow-black/20 backdrop-blur-sm",
                    title: "text-[13px] font-medium text-foreground",
                    description: "text-[12px] text-muted-foreground",
                    loading: "border-border bg-background text-foreground",
                    success: "!bg-emerald-950/50 !border-emerald-800 !text-emerald-400",
                    error: "!bg-rose-950/50 !border-rose-800 !text-rose-400",
                    info: "!bg-sky-950/50 !border-sky-800 !text-sky-400",
                    warning: "!bg-amber-950/50 !border-amber-800 !text-amber-400",
                    icon: "group-data-[type=success]:!text-emerald-400 group-data-[type=error]:!text-rose-400 group-data-[type=warning]:!text-amber-400 group-data-[type=info]:!text-sky-400",
                    closeButton: "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                },
            }}
        />
    );
}
