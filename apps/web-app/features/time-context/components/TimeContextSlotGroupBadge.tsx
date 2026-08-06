import { Edit2, X } from "lucide-react";
import type { FormattedSlotGroup } from "../utils/formatSlots";

interface TimeContextSlotGroupBadgeProps {
  group: FormattedSlotGroup;
  onEdit: (group: FormattedSlotGroup) => void;
  onRemove: (group: FormattedSlotGroup) => void;
}

export function TimeContextSlotGroupBadge({
  group,
  onEdit,
  onRemove,
}: TimeContextSlotGroupBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-2xs group">
      <span>
        {group.daysLabel}: {group.timeLabel}
      </span>
      <button
        type="button"
        onClick={() => onEdit(group)}
        title="Chỉnh sửa khung giờ"
        className="p-0.5 hover:bg-teal-500/20 rounded text-teal-300 hover:text-teal-100 transition-colors cursor-pointer"
      >
        <Edit2 className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(group)}
        title="Xóa khung giờ"
        className="p-0.5 hover:bg-destructive/20 rounded text-teal-300 hover:text-destructive transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
