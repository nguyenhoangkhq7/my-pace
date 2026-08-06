"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { TimeQuarterPassIcon, CalendarCheckIn01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/hooks/use-translation";

interface FixedEventAvailabilitySelectorProps {
  availabilityStatus: "BUSY" | "FREE";
  onAvailabilityChange: (status: "BUSY" | "FREE") => void;
}

export function FixedEventAvailabilitySelector({
  availabilityStatus,
  onAvailabilityChange,
}: FixedEventAvailabilitySelectorProps) {
  const { locale } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="evt-availability">{locale === 'vi' ? 'Trạng thái thời gian' : 'Availability'}</Label>
      <Select
        value={availabilityStatus}
        onValueChange={(val) => onAvailabilityChange(val as "BUSY" | "FREE")}
      >
        <SelectTrigger id="evt-availability" className="w-full bg-card border-border">
          <SelectValue placeholder={locale === 'vi' ? 'Chọn trạng thái' : 'Select availability'} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border text-foreground">
          <SelectItem value="BUSY">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={TimeQuarterPassIcon} className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{locale === 'vi' ? 'Bận (Trừ thời gian khả dụng)' : 'Busy (Deducts available time)'}</span>
            </div>
          </SelectItem>
          <SelectItem value="FREE">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={CalendarCheckIn01Icon} className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{locale === 'vi' ? 'Rảnh (Chỉ hiển thị)' : 'Free (Display only)'}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
