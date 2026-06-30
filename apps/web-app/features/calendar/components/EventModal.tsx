"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecurringActionDialog } from "./RecurringActionDialog";
import type {
  CreateEventPayload,
  FixedEventOccurrence,
  ModalMode,
  RecurrenceType,
  UpdateOccurrencePayload,
} from "../types";
import { DAYS_OF_WEEK, RECURRENCE_LABELS } from "../types";
import { cn } from "@/lib/utils";

interface EventModalProps {
  open: boolean;
  mode: ModalMode;
  /** Pre-filled values from drag-select. */
  defaultDate?: string;
  defaultStart?: string;
  defaultEnd?: string;
  /** The occurrence being edited (edit mode). */
  occurrence?: FixedEventOccurrence;
  onClose: () => void;
  createEvent: (payload: CreateEventPayload) => Promise<FixedEventOccurrence>;
  updateAllOccurrences: (seriesId: string, payload: CreateEventPayload) => Promise<void>;
  updateSingleOccurrence: (seriesId: string, date: string, payload: UpdateOccurrencePayload) => Promise<void>;
  deleteAllOccurrences: (seriesId: string) => Promise<void>;
  deleteSingleOccurrence: (seriesId: string, date: string) => Promise<void>;
}

type RecurringDialogAction = "edit" | "delete";

export function EventModal({
  open,
  mode,
  defaultDate,
  defaultStart,
  defaultEnd,
  occurrence,
  onClose,
  createEvent,
  updateAllOccurrences,
  updateSingleOccurrence,
  deleteAllOccurrences,
  deleteSingleOccurrence,
}: EventModalProps) {

  // ── Form State ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [startTime, setStartTime] = useState(defaultStart ?? "");
  const [endTime, setEndTime] = useState(defaultEnd ?? "");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("NONE");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // ── UI State ───────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recurring confirmation dialog
  const [recurringDialog, setRecurringDialog] = useState<{
    open: boolean;
    action: RecurringDialogAction;
  }>({ open: false, action: "edit" });

  // ── Populate form when editing ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && occurrence) {
      setTitle(occurrence.title);
      setNotes(occurrence.notes ?? "");
      setDate(occurrence.occurrenceDate);
      setStartTime(occurrence.startTime.substring(0, 5));
      setEndTime(occurrence.endTime.substring(0, 5));
      setRecurrenceType(occurrence.recurrenceType);
      setSelectedDays(occurrence.recurrenceDaysOfWeek ?? []);
      setRecurrenceEndDate(occurrence.recurrenceEndDate ?? "");
    } else {
      // Create mode — use drag-select defaults
      setTitle("");
      setNotes("");
      setDate(defaultDate ?? "");
      setStartTime(defaultStart ?? "");
      setEndTime(defaultEnd ?? "");
      setRecurrenceType("NONE");
      setSelectedDays([]);
      setRecurrenceEndDate("");
    }
    setError(null);
  }, [open, mode, occurrence, defaultDate, defaultStart, defaultEnd]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleDay = (day: number) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const buildPayload = (): CreateEventPayload => ({
    title: title.trim(),
    notes: notes.trim() || undefined,
    startTime: `${startTime}:00`,
    endTime: `${endTime}:00`,
    eventDate: date || undefined,
    recurrenceType,
    recurrenceDaysOfWeek:
      recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM"
        ? selectedDays
        : undefined,
    recurrenceEndDate: recurrenceEndDate || undefined,
  });

  const validate = (): boolean => {
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề"); return false; }
    if (!startTime || !endTime) { setError("Vui lòng chọn giờ bắt đầu và kết thúc"); return false; }
    if (startTime >= endTime) { setError("Giờ kết thúc phải sau giờ bắt đầu"); return false; }
    if (recurrenceType === "NONE" && !date) { setError("Vui lòng chọn ngày"); return false; }
    if ((recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM") && selectedDays.length === 0) {
      setError("Vui lòng chọn ít nhất một ngày trong tuần"); return false;
    }
    return true;
  };

  // ── Submit: handle recurring dialog flow ──────────────────────────────────

  const handleSaveClick = () => {
    setError(null);
    if (!validate()) return;

    if (mode === "create") {
      submitCreate();
      return;
    }

    // Edit mode: if recurring → show scope dialog
    if (occurrence && occurrence.recurrenceType !== "NONE") {
      setRecurringDialog({ open: true, action: "edit" });
    } else {
      // Non-recurring: direct update (all occurrences = the one event)
      submitUpdateAll();
    }
  };

  const handleDeleteClick = () => {
    if (!occurrence) return;
    if (occurrence.recurrenceType !== "NONE") {
      setRecurringDialog({ open: true, action: "delete" });
    } else {
      submitDeleteAll();
    }
  };

  // ── Actual API calls ──────────────────────────────────────────────────────

  const submitCreate = async () => {
    setIsSubmitting(true);
    try {
      await createEvent(buildPayload());
      onClose();
    } catch {
      setError("Không thể tạo sự kiện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitUpdateAll = async () => {
    if (!occurrence) return;
    setIsSubmitting(true);
    setRecurringDialog({ open: false, action: "edit" });
    try {
      await updateAllOccurrences(occurrence.seriesId, buildPayload());
      onClose();
    } catch {
      setError("Không thể cập nhật sự kiện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitUpdateSingle = async () => {
    if (!occurrence) return;
    setIsSubmitting(true);
    setRecurringDialog({ open: false, action: "edit" });
    const payload: UpdateOccurrencePayload = {
      overrideTitle: title.trim(),
      overrideNotes: notes.trim() || undefined,
      overrideStartTime: `${startTime}:00`,
      overrideEndTime: `${endTime}:00`,
    };
    try {
      await updateSingleOccurrence(occurrence.seriesId, occurrence.occurrenceDate, payload);
      onClose();
    } catch {
      setError("Không thể cập nhật sự kiện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDeleteAll = async () => {
    if (!occurrence) return;
    setIsSubmitting(true);
    setRecurringDialog({ open: false, action: "delete" });
    try {
      await deleteAllOccurrences(occurrence.seriesId);
      onClose();
    } catch {
      setError("Không thể xóa sự kiện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDeleteSingle = async () => {
    if (!occurrence) return;
    setIsSubmitting(true);
    setRecurringDialog({ open: false, action: "delete" });
    try {
      await deleteSingleOccurrence(occurrence.seriesId, occurrence.occurrenceDate);
      onClose();
    } catch {
      setError("Không thể xóa sự kiện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isRecurring = occurrence?.recurrenceType !== "NONE";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Thêm sự kiện cố định" : "Chỉnh sửa sự kiện"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="evt-title">Tiêu đề *</Label>
              <Input
                id="evt-title"
                placeholder="VD: Buổi học, Họp nhóm..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="evt-notes">Ghi chú</Label>
              <Textarea
                id="evt-notes"
                placeholder="Thêm ghi chú (tùy chọn)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Date + Times row */}
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

            {/* Recurrence selector — only show in create mode or when editing all */}
            {(mode === "create" || !isRecurring) && (
              <div className="flex flex-col gap-2">
                <Label>Lặp lại</Label>
                <div className="flex flex-wrap gap-2">
                  {(["NONE", "DAILY", "WEEKLY", "CUSTOM"] as RecurrenceType[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRecurrenceType(r);
                        if (r !== "WEEKLY" && r !== "CUSTOM") setSelectedDays([]);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                        recurrenceType === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {RECURRENCE_LABELS[r]}
                    </button>
                  ))}
                </div>

                {/* Day-of-week picker for WEEKLY / CUSTOM */}
                {(recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM") && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        className={cn(
                          "w-9 h-9 rounded-full text-xs font-semibold border transition-all",
                          selectedDays.includes(d.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Recurrence end date */}
                {recurrenceType !== "NONE" && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <Label htmlFor="evt-rec-end">Kết thúc lặp lại (để trống = vô thời hạn)</Label>
                    <Input
                      id="evt-rec-end"
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      min={date || undefined}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {mode === "edit" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                disabled={isSubmitting}
                className="sm:mr-auto"
              >
                Xóa
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSaveClick} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : mode === "create" ? "Tạo sự kiện" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring scope confirmation */}
      <RecurringActionDialog
        open={recurringDialog.open}
        action={recurringDialog.action}
        onSelectSingle={
          recurringDialog.action === "delete" ? submitDeleteSingle : submitUpdateSingle
        }
        onSelectAll={
          recurringDialog.action === "delete" ? submitDeleteAll : submitUpdateAll
        }
        onCancel={() => setRecurringDialog({ open: false, action: "edit" })}
      />
    </>
  );
}
