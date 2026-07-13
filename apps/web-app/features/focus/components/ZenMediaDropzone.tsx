import React from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";

interface ZenMediaDropzoneProps {
  isDragOver: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export function ZenMediaDropzone({
  isDragOver,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
  className,
}: ZenMediaDropzoneProps) {
  return (
    <div
      className={cn("relative transition-colors", className, isDragOver ? "bg-primary/5" : "")}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md border-2 border-dashed border-primary flex items-center justify-center rounded-xl m-2 pointer-events-none">
          <div className="text-center">
            <HugeiconsIcon icon={PlusSignIcon} size={32} className="mx-auto text-primary mb-2" />
            <p className="text-primary font-bold tracking-wide">Thả để thêm video</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
