import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, CheckmarkCircle01Icon, PauseIcon, Archive02Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface GoalStatusBadgeProps {
  status: string;
}

export function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Done": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Archived": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-orange-500/10 text-orange-500 border-orange-500/20"; // Freeze
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress": return <HugeiconsIcon icon={PlayIcon} size={14} className="mr-1" />;
      case "Done": return <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="mr-1" />;
      case "Archived": return <HugeiconsIcon icon={Archive02Icon} size={14} className="mr-1" />;
      default: return <HugeiconsIcon icon={PauseIcon} size={14} className="mr-1" />; // Freeze
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "In Progress": return t.goals.inProgress;
      case "Done": return t.goals.done;
      case "Archived": return t.goals.archived;
      default: return t.goals.freeze;
    }
  };

  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      {getStatusIcon(status)}
      {getStatusLabel(status)}
    </Badge>
  );
}
