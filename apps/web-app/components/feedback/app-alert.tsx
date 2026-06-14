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
    success: "bg-emerald-950/50 border-emerald-800 text-emerald-400",
    error: "bg-rose-950/50 border-rose-800 text-rose-400",
    info: "border-border bg-card text-foreground",
    loading: "border-border bg-card text-muted-foreground",
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
                    <div className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </div>
                ) : null}
            </div>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}

