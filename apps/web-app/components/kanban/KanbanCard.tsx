import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KanbanCardData } from "@/components/kanban/types";

type KanbanCardProps = {
  card: KanbanCardData;
};

export function KanbanCard({ card }: KanbanCardProps) {
  return (
    <Card className="bg-pace-card">
      <CardContent className="space-y-3 px-4 pb-4 pt-4">
        <p
          className={cn(
            "text-sm font-medium leading-5 text-slate-100",
            card.completed && "text-slate-500 line-through"
          )}
        >
          {card.title}
        </p>
        {card.tag ? (
          <Badge className={card.tag.className}>{card.tag.label}</Badge>
        ) : null}
        {typeof card.progress === "number" ? (
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-pace-accent-strong"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

