import { useState, useEffect } from "react";
import type {
  CreateEventPayload,
  FixedEventOccurrence,
  ModalMode,
  RecurrenceType,
  UpdateOccurrencePayload,
} from "../types";

export type RecurringDialogAction = "edit" | "delete";

export interface UseEventFormProps {
  open: boolean;
  mode: ModalMode;
  defaultDate?: string;
  defaultStart?: string;
  defaultEnd?: string;
  occurrence?: FixedEventOccurrence;
  onClose: () => void;
  createEvent: (payload: CreateEventPayload) => Promise<FixedEventOccurrence>;
  updateAllOccurrences: (seriesId: string, payload: CreateEventPayload) => Promise<void>;
  updateSingleOccurrence: (seriesId: string, date: string, payload: UpdateOccurrencePayload) => Promise<void>;
  deleteAllOccurrences: (seriesId: string) => Promise<void>;
  deleteSingleOccurrence: (seriesId: string, date: string) => Promise<void>;
}

export function useEventForm({
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
}: UseEventFormProps) {
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
    Promise.resolve().then(() => {
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
    });
  }, [open, mode, occurrence, defaultDate, defaultStart, defaultEnd]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleDay = (day: number) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleRecurrenceTypeChange = (type: RecurrenceType) => {
    setRecurrenceType(type);
    if (type !== "WEEKLY" && type !== "CUSTOM") {
      setSelectedDays([]);
    }
  };

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

  const handleCancelRecurringDialog = () => {
    setRecurringDialog({ open: false, action: "edit" });
  };

  const isRecurring = occurrence?.recurrenceType !== "NONE";

  return {
    title,
    setTitle,
    notes,
    setNotes,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    recurrenceType,
    setRecurrenceType: handleRecurrenceTypeChange,
    selectedDays,
    setSelectedDays,
    recurrenceEndDate,
    setRecurrenceEndDate,
    isSubmitting,
    error,
    recurringDialog,
    isRecurring,

    // Handlers
    toggleDay,
    handleSaveClick,
    handleDeleteClick,
    submitUpdateSingle,
    submitUpdateAll,
    submitDeleteSingle,
    submitDeleteAll,
    handleCancelRecurringDialog,
  };
}
