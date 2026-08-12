import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/components/ui/time-select";
import { ModalMode, RecurrenceType } from "../types";

interface EventDateTimeRowProps {
  date: string;
  setDate: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  isAllDay: boolean;
  setIsAllDay: (val: boolean) => void;
  recurrenceType: RecurrenceType;
  mode: ModalMode;
}

export function EventDateTimeRow({
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  isAllDay,
  setIsAllDay,
  recurrenceType,
  mode,
}: EventDateTimeRowProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          id="evt-allday"
          type="checkbox"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
        <Label htmlFor="evt-allday" className="cursor-pointer font-medium text-sm select-none">
          Sự kiện cả ngày
        </Label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="evt-date">Ngày *</Label>
          <Input
            id="evt-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={recurrenceType !== "NONE" && mode === "create"}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="evt-start">Bắt đầu {!isAllDay && "*"}</Label>
          <TimeSelect
            value={isAllDay ? "" : startTime}
            onChange={setStartTime}
            disabled={isAllDay}
            size="md"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="evt-end">Kết thúc {!isAllDay && "*"}</Label>
          <TimeSelect
            value={isAllDay ? "" : endTime}
            onChange={setEndTime}
            disabled={isAllDay}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}

