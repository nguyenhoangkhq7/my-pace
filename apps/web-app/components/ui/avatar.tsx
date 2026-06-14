import * as React from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

type AvatarProps = React.ComponentProps<"div">;

type AvatarImageProps = Omit<ImageProps, "fill">;

type AvatarFallbackProps = React.ComponentProps<"div">;

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-card",
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

function AvatarImage({ className, alt, ...props }: AvatarImageProps) {
  return (
    <Image
      fill
      sizes="40px"
      alt={alt}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
