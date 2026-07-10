import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalMode, RecurrenceType } from "../types";

interface EventDateTimeRowProps {
  date: string;
  setDate: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
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
  recurrenceType,
  mode,
}: EventDateTimeRowProps) {
  return (
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
        <Label htmlFor="evt-start">Bắt đầu *</Label>
        <Input
          id="evt-start"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="evt-end">Kết thúc *</Label>
        <Input
          id="evt-end"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
    </div>
  );
}
