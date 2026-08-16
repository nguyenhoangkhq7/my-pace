"use client";

import { useState } from "react";
import { ListTodo, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface QuickAddChecklistButtonProps {
  checklists: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export function QuickAddChecklistButton({ checklists, onAdd, onRemove }: QuickAddChecklistButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onAdd(inputVal.trim());
    setInputVal("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t.sunsamaForm.checklistTooltip}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
            checklists.length > 0
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              : "text-muted-foreground border-transparent hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <ListTodo className="h-3.5 w-3.5 opacity-80" />
          {checklists.length > 0 && (
            <span className="text-[11px] font-semibold">{checklists.length}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 space-y-2 bg-popover text-popover-foreground border-border shadow-lg" align="start">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {t.sunsamaForm.checklistTitle}
        </p>

        {checklists.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin">
            {checklists.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-muted text-foreground px-2 py-1 rounded border border-border/40 group"
              >
                <span className="truncate pr-1">• {item}</span>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-muted-foreground hover:text-destructive shrink-0 cursor-pointer opacity-70 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-1 pt-1">
          <Input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t.sunsamaForm.checklistPlaceholder}
            className="h-7 text-xs bg-muted/30"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-7 text-xs px-2">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
