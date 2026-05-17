import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessStateProps {
    title: string;
    description: ReactNode;
    badge?: string;
    actions?: ReactNode;
    className?: string;
}

export function SuccessState({
    title,
    description,
    badge = "Success",
    actions,
    className,
}: SuccessStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center", className)}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-2xl text-emerald-400">
                ✓
            </div>

            <div className="mt-6 space-y-3">
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    {badge}
                </span>

                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {title}
                </h2>

                <div className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {description}
                </div>
            </div>

            {actions ? <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">{actions}</div> : null}
        </div>
    );
}

type SuccessStateActionButtonProps = ComponentProps<typeof Button> & {
    children: ReactNode;
};

export function SuccessStateActionButton({ children, className, ...props }: SuccessStateActionButtonProps) {
    return (
        <Button {...props} className={cn("h-12 flex-1 rounded-xl", className)}>
            {children}
        </Button>
    );
}




