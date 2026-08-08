import { Button } from "@/components/ui/button";
import { Clock, Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { formatSlotGroups } from "../utils/formatSlots";
import type { TimeContext } from "../types";

interface TimeContextItemProps {
  context: TimeContext;
  onEdit: (context: TimeContext) => void;
  onDelete: (id: string, name: string) => void;
}

export function TimeContextItem({ context, onEdit, onDelete }: TimeContextItemProps) {
  const { t } = useTranslation();
  const slotGroups = formatSlotGroups(context.slots || []);

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-card/60 hover:bg-accent/30 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm text-foreground truncate">{context.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(context)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(context.id, context.name)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Formatted Grouped Slots */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {slotGroups.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">{t.timeContext.noSlotsYet}</span>
        ) : (
          slotGroups.map((group, index) => (
            <span
              key={index}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/30"
            >
              {group.daysLabel}: {group.timeLabel}
            </span>
          ))
        )}
      </div>

      {/* Categories assigned */}
      {context.categories && context.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-border/40">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">{t.categories.title}:</span>
          {context.categories.map((cat) => (
            <span
              key={cat.id}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full text-white shadow-xs"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
