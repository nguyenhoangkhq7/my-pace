"use client";

import { useState } from "react";
import { Flag, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddPriorityButtonProps {
  isUrgent: boolean;
  isImportant: boolean;
  onChange: (urgent: boolean, important: boolean) => void;
}

export function QuickAddPriorityButton({ isUrgent, isImportant, onChange }: QuickAddPriorityButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const quadrants = [
    { id: "q1", urgent: true, important: true, label: t.sunsamaForm.q1, color: "text-red-500 bg-red-500/10 border-red-500/30" },
    { id: "q2", urgent: false, important: true, label: t.sunsamaForm.q2, color: "text-primary bg-primary/10 border-primary/30" },
    { id: "q3", urgent: true, important: false, label: t.sunsamaForm.q3, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
    { id: "q4", urgent: false, important: false, label: t.sunsamaForm.q4, color: "text-muted-foreground bg-muted/40 border-border/50" },
  ];

  const activeQ = quadrants.find((q) => q.urgent === isUrgent && q.important === isImportant) || quadrants[3];

  const handleSelect = (urgent: boolean, important: boolean) => {
    onChange(urgent, important);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${t.sunsamaForm.priority}: ${activeQ.label}`}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            activeQ.id !== "q4"
              ? activeQ.color
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Flag className={`h-3.5 w-3.5 ${activeQ.id !== "q4" ? "fill-current" : "opacity-70"}`} />
          {activeQ.id !== "q4" && (
            <span className="text-[11px] font-semibold">{activeQ.id.toUpperCase()}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1.5 space-y-1 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
          {t.sunsamaForm.priority}
        </p>
        <div className="space-y-0.5">
          {quadrants.map((q) => {
            const isSelected = isUrgent === q.urgent && isImportant === q.important;
            return (
              <Button
                key={q.id}
                variant="ghost"
                size="sm"
                className="w-full justify-between h-7 text-xs font-normal"
                onClick={() => handleSelect(q.urgent, q.important)}
              >
                <div className="flex items-center gap-2">
                  <Flag
                    className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "fill-current" : ""} ${
                      q.id === "q1"
                        ? "text-red-500"
                        : q.id === "q2"
                        ? "text-blue-500"
                        : q.id === "q3"
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span>{q.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
