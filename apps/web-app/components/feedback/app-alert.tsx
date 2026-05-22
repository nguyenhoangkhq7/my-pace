import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type AppAlertVariant = "success" | "error" | "info" | "loading";

interface AppAlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: AppAlertVariant;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
}

const variantStyles: Record<AppAlertVariant, string> = {
    success: "border-emerald-500/30 bg-slate-900/95 text-white",
    error: "border-rose-500/30 bg-slate-900/95 text-white",
    info: "border-primary/30 bg-slate-900/95 text-white",
    loading: "border-slate-700 bg-slate-900/95 text-white",
};

export function AppAlert({
    variant = "info",
    title,
    description,
    action,
    className,
    ...props
}: AppAlertProps) {
    return (
        <div
            role="alert"
            className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-current shrink-0" />

            <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold leading-none">
                    {title}
                </p>

                {description ? (
                    <div className="text-sm leading-relaxed text-white/80">
                        {description}
                    </div>
                ) : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

