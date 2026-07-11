import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useBoardStore } from "../store/board.store";
import { ConfirmDeleteDialog } from "@/components/feedback/ConfirmDeleteDialog";
import { CategoryEditForm } from "./CategoryEditForm";
import { CategoryListItem } from "./CategoryListItem";
import { useTranslation } from "@/hooks/use-translation";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const { categories, updateCategory, deleteCategory } = useBoardStore();
  const { t } = useTranslation();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleStartEdit = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setError("");
  };

  const handleSaveEdit = async (id: string, name: string, color: string) => {
    if (!name.trim()) {
      setError(t.categories.nameEmpty);
      return;
    }
    
    // Check if name is unique among other categories
    const isDuplicate = categories.some(c => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) {
      setError(t.categories.nameExists);
      return;
    }

    try {
      await updateCategory(id, { name: name.trim(), color: color });
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.categories.updateFailed);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        handleCancelEdit();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.categories.deleteFailed);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background text-foreground border-border sm:max-w-[450px] max-h-[80vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t.categories.manageTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.categories.manageDesc}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-red-500 text-xs mt-1 shrink-0">{error}</p>}

        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 scrollbar-thin">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t.categories.noneYet}</p>
          ) : (
            categories.map((c) => {
              const isEditing = editingId === c.id;
              
              if (isEditing) {
                return (
                  <CategoryEditForm
                    key={c.id}
                    category={c}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                  />
                );
              }

              return (
                <CategoryListItem
                  key={c.id}
                  category={c}
                  onStartEdit={() => handleStartEdit(c)}
                  onDeleteClick={() => handleDeleteClick(c.id, c.name)}
                />
              );
            })
          )}
        </div>

        <DialogFooter className="mt-4 border-t border-border pt-4 shrink-0">
          <Button variant="outline" className="border-border bg-card hover:bg-muted text-foreground h-9" onClick={onClose}>
            {t.categories.close}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDeleteDialog
        isOpen={isConfirmDeleteOpen}
        title={t.categories.deleteTitle}
        description={t.categories.deleteDesc(deleteTarget?.name || "")}
        onConfirm={handleConfirmDelete}
        onOpenChange={setIsConfirmDeleteOpen}
      />
    </Dialog>
  );
}
