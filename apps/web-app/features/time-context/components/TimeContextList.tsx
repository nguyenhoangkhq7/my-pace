import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useTimeContexts } from "../hooks/useTimeContexts";
import { TimeContextItem } from "./TimeContextItem";
import { TimeContextFormModal } from "./TimeContextFormModal";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import type { TimeContext, TimeContextSlot } from "../types";

export function TimeContextList() {
  const { t } = useTranslation();
  const { timeContexts, isLoading, createTimeContext, updateTimeContext, deleteTimeContext } = useTimeContexts();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<TimeContext | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleOpenCreate = () => {
    setEditingContext(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (context: TimeContext) => {
    setEditingContext(context);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteTimeContext(deleteTarget.id);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleSaveForm = async (data: { name: string; slots: TimeContextSlot[]; categoryIds: string[] }) => {
    if (editingContext) {
      await updateTimeContext({ id: editingContext.id, data });
    } else {
      await createTimeContext(data);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-muted-foreground text-center py-6">{t.timeContext.loading}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t.timeContext.title}</span>
        <Button size="sm" onClick={handleOpenCreate} className="h-7 text-xs gap-1 cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> {t.timeContext.createButton}
        </Button>
      </div>

      {timeContexts.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-border rounded-xl bg-card/30">
          <p className="text-xs text-muted-foreground">{t.timeContext.noContextsYet}</p>
          <Button variant="outline" size="sm" onClick={handleOpenCreate} className="mt-2 text-xs cursor-pointer border-border text-foreground">
            {t.timeContext.createFirstButton}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
          {timeContexts.map((ctx) => (
            <TimeContextItem
              key={ctx.id}
              context={ctx}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      <TimeContextFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialContext={editingContext}
        onSave={handleSaveForm}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        title={t.timeContext.deleteTitle}
        description={t.timeContext.deleteDesc(deleteTarget?.name || "")}
        onConfirm={handleConfirmDelete}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
}
