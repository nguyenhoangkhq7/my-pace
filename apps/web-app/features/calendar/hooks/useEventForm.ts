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
  updateFromDateOnwards: (seriesId: string, date: string, payload: CreateEventPayload) => Promise<void>;
  deleteAllOccurrences: (seriesId: string) => Promise<void>;
  deleteSingleOccurrence: (seriesId: string, date: string) => Promise<void>;
  deleteFromDateOnwards: (seriesId: string, date: string) => Promise<void>;
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
  updateFromDateOnwards,
  deleteAllOccurrences,
  deleteSingleOccurrence,
  deleteFromDateOnwards,
}: UseEventFormProps) {
  // ── Form State ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [startTime, setStartTime] = useState(defaultStart ?? "");
  const [endTime, setEndTime] = useState(defaultEnd ?? "");
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("NONE");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("BUSY");

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
        setStartTime(occurrence.startTime ? occurrence.startTime.substring(0, 5) : "09:00");
        setEndTime(occurrence.endTime ? occurrence.endTime.substring(0, 5) : "10:00");
        setIsAllDay(!!occurrence.isAllDay);
        setRecurrenceType(occurrence.recurrenceType);
        setSelectedDays(occurrence.recurrenceDaysOfWeek ?? []);
        setRecurrenceEndDate(occurrence.recurrenceEndDate ?? "");
        setCategoryId(occurrence.categoryId ?? occurrence.category?.id ?? undefined);
        setAvailabilityStatus(occurrence.availabilityStatus || "BUSY");
      } else {
        // Create mode — use drag-select defaults
        setTitle("");
        setNotes("");
        setDate(defaultDate ?? "");
        setStartTime(defaultStart ?? "09:00");
        setEndTime(defaultEnd ?? "10:00");
        setIsAllDay(false);
        setRecurrenceType("NONE");
        setSelectedDays([]);
        setRecurrenceEndDate("");
        setCategoryId(undefined);
        setAvailabilityStatus("BUSY");
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
    startTime: isAllDay ? undefined : `${startTime}:00`,
    endTime: isAllDay ? undefined : `${endTime}:00`,
    isAllDay,
    eventDate: date || undefined,
    recurrenceType,
    recurrenceDaysOfWeek:
      recurrenceType === "WEEKLY" || recurrenceType === "CUSTOM"
        ? selectedDays
        : undefined,
    recurrenceEndDate: recurrenceEndDate || undefined,
    categoryId: categoryId || undefined,
    availabilityStatus: availabilityStatus,
  });

  const validate = (): boolean => {
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề"); return false; }
    if (!isAllDay) {
      if (!startTime || !endTime) { setError("Vui lòng chọn giờ bắt đầu và kết thúc"); return false; }
      if (startTime >= endTime) { setError("Giờ kết thúc phải sau giờ bắt đầu"); return false; }
    }
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
      overrideStartTime: isAllDay ? undefined : `${startTime}:00`,
      overrideEndTime: isAllDay ? undefined : `${endTime}:00`,
      overrideIsAllDay: isAllDay,
      overrideCategoryId: categoryId || null,
      overrideAvailabilityStatus: availabilityStatus,
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

  const submitUpdateFollowing = async () => {
    if (!occurrence) return;
    setIsSubmitting(true);
    setRecurringDialog({ open: false, action: "edit" });
    try {
      await updateFromDateOnwards(occurrence.seriesId, occurrence.occurrenceDate, buildPayload());
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

  const submitDeleteFollowing = async () => {
    if (!occurrence) return;
    setIsSubmitting(true);
    setRecurringDialog({ open: false, action: "delete" });
    try {
      await deleteFromDateOnwards(occurrence.seriesId, occurrence.occurrenceDate);
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
    isAllDay,
    setIsAllDay,
    recurrenceType,
    setRecurrenceType: handleRecurrenceTypeChange,
    selectedDays,
    setSelectedDays,
    recurrenceEndDate,
    setRecurrenceEndDate,
    categoryId,
    setCategoryId,
    availabilityStatus,
    setAvailabilityStatus,
    isSubmitting,
    error,
    recurringDialog,
    isRecurring,

    // Handlers
    toggleDay,
    handleSaveClick,
    handleDeleteClick,
    submitUpdateSingle,
    submitUpdateFollowing,
    submitUpdateAll,
    submitDeleteSingle,
    submitDeleteFollowing,
    submitDeleteAll,
    handleCancelRecurringDialog,
  };


}
