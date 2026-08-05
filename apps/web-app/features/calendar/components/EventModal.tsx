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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurringActionDialog } from "./RecurringActionDialog";
import { EventDateTimeRow } from "./EventDateTimeRow";
import { RecurrenceSelector } from "./RecurrenceSelector";
import { FixedEventCategorySelector } from "./FixedEventCategorySelector";
import { useEventForm, UseEventFormProps } from "../hooks/useEventForm";
import { useTranslation } from "@/hooks/use-translation";
import type { FixedEventOccurrence } from "../types";

export function EventModal(props: UseEventFormProps) {
  const {
    open,
    mode,
    onClose,
  } = props;
  const { t } = useTranslation();

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
    isAllDay,
    setIsAllDay,
    recurrenceType,
    setRecurrenceType,
    selectedDays,
    recurrenceEndDate,
    setRecurrenceEndDate,
    categoryId,
    setCategoryId,
    isSubmitting,
    error,
    recurringDialog,
    isRecurring,
    availabilityStatus,
    setAvailabilityStatus,

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
  } = useEventForm(props);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? t.calendar.addEvent : t.calendar.editEvent}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="evt-title">{t.calendar.titleLabel}</Label>
              <Input
                id="evt-title"
                placeholder={t.calendar.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Category */}
            <FixedEventCategorySelector
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
            />

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="evt-notes">{t.calendar.notesLabel}</Label>
              <Textarea
                id="evt-notes"
                placeholder={t.calendar.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Availability Status */}
            <div className="flex flex-col gap-1.5">
              <Label>{t.calendar.showAs}</Label>
              <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t.calendar.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUSY">{t.calendar.statusBusy}</SelectItem>
                  <SelectItem value="FREE">{t.calendar.statusFree}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date + Times row */}
            <EventDateTimeRow
              date={date}
              setDate={setDate}
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              isAllDay={isAllDay}
              setIsAllDay={setIsAllDay}
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
                {t.calendar.deleteBtn}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              {t.calendar.cancelBtn}
            </Button>
            <Button size="sm" onClick={handleSaveClick} disabled={isSubmitting}>
              {isSubmitting ? t.calendar.saving : mode === "create" ? t.calendar.createBtn : t.calendar.saveChanges}
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
        onSelectFollowing={
          recurringDialog.action === "delete" ? submitDeleteFollowing : submitUpdateFollowing
        }
        onSelectAll={
          recurringDialog.action === "delete" ? submitDeleteAll : submitUpdateAll
        }
        onCancel={handleCancelRecurringDialog}
      />
    </>
  );
}

