"use client";

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
import { EventDateTimeRow } from "./EventDateTimeRow";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { useEventForm, UseEventFormProps } from "../hooks/useEventForm";

export function EventModal(props: UseEventFormProps) {
  const {
    open,
    mode,
    onClose,
  } = props;

  const {
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
    setRecurrenceType,
    selectedDays,
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
  } = useEventForm(props);

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
            <EventDateTimeRow
              date={date}
              setDate={setDate}
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              recurrenceType={recurrenceType}
              mode={mode}
            />

            {/* Recurrence selector — only show in create mode or when editing all */}
            {(mode === "create" || !isRecurring) && (
              <RecurrenceSelector
                recurrenceType={recurrenceType}
                setRecurrenceType={setRecurrenceType}
                selectedDays={selectedDays}
                toggleDay={toggleDay}
                recurrenceEndDate={recurrenceEndDate}
                setRecurrenceEndDate={setRecurrenceEndDate}
                date={date}
              />
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
        onCancel={handleCancelRecurringDialog}
      />
    </>
  );
}
