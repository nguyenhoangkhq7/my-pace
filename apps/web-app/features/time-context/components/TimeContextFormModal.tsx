import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { TimeSlotPickerModal } from "./TimeSlotPickerModal";
import { formatSlotGroups } from "../utils/formatSlots";
import type { TimeContext, TimeContextSlot } from "../types";

interface TimeContextFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: TimeContext | null;
  onSave: (data: { name: string; slots: TimeContextSlot[]; categoryIds: string[] }) => Promise<void>;
}

export function TimeContextFormModal({
  isOpen,
  onClose,
  initialContext,
  onSave,
}: TimeContextFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<TimeContextSlot[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialContext) {
        setName(initialContext.name);
        setSlots(initialContext.slots || []);
        setSelectedCategoryIds(initialContext.categories?.map((c) => c.id) || []);
      } else {
        setName("");
        setSlots([]);
        setSelectedCategoryIds([]);
      }
      setError("");
    }
  }, [isOpen, initialContext]);

  const handleAddSlots = (newSlots: TimeContextSlot[]) => {
    setSlots((prev) => [...prev, ...newSlots]);
  };

  const handleClearAllSlots = () => {
    setSlots([]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.timeContext.nameRequired);
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        slots,
        categoryIds: selectedCategoryIds,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.categories.updateFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slotGroups = formatSlotGroups(slots);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-background text-foreground border-border sm:max-w-[480px] max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle>{initialContext ? t.timeContext.editTitle : t.timeContext.createTitle}</DialogTitle>
          </DialogHeader>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin">
            {/* Context Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                {t.timeContext.nameLabel}
              </label>
              <Input
                placeholder={t.timeContext.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>

            {/* Time Slots Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  {t.timeContext.slotsLabel}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSlotPickerOpen(true)}
                  className="h-7 text-xs gap-1 cursor-pointer border-border text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" /> {t.timeContext.addSlot}
                </Button>
              </div>

              {/* Slots Summary Badges */}
              <div className="p-3 bg-muted/30 border border-border/60 rounded-xl min-h-[50px] flex flex-wrap gap-1.5 items-center">
                {slotGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {t.timeContext.noSlotsYet}. Bấm "{t.timeContext.addSlot}" để chọn thứ & khung giờ.
                  </p>
                ) : (
                  <>
                    {slotGroups.map((group, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-2xs"
                      >
                        {group.daysLabel}: {group.timeLabel}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearAllSlots}
                      className="ml-auto text-[10px] text-muted-foreground hover:text-destructive underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Category Multi-Select Tag/Chip Input */}
            <CategoryMultiSelect
              selectedIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
            />
          </div>

          <DialogFooter className="mt-4 border-t border-border pt-3 shrink-0">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="cursor-pointer">
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? t.timeContext.savingContext : t.timeContext.saveContext}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TimeSlotPickerModal
        isOpen={isSlotPickerOpen}
        onClose={() => setIsSlotPickerOpen(false)}
        onAddSlots={handleAddSlots}
      />
    </>
  );
}
