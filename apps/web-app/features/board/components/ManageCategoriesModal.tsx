import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useBoardStore } from "../store/board.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#6366f1", "#14b8a6", "#ec4899", "#ef4444", "#475569"];

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const { categories, updateCategory, deleteCategory } = useBoardStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const editCategoryColorInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color || CATEGORY_COLORS[0]);
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setError("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError("Tên Category không được để trống");
      return;
    }
    
    // Check if name is unique among other categories
    const isDuplicate = categories.some(c => c.id !== id && c.name.toLowerCase() === editName.trim().toLowerCase());
    if (isDuplicate) {
      setError("Tên Category đã tồn tại");
      return;
    }

    try {
      await updateCategory(id, { name: editName.trim(), color: editColor });
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật Category");
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
      setError("");
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa Category");
      setIsConfirmDeleteOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-950 text-slate-50 border-slate-800 sm:max-w-[450px] max-h-[80vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Quản lý Category</DialogTitle>
          <DialogDescription className="text-slate-400">
            Chỉnh sửa tên, màu sắc hoặc xóa các Category hiện có.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-red-500 text-xs mt-1 shrink-0">{error}</p>}

        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 scrollbar-thin">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Chưa có Category nào.</p>
          ) : (
            categories.map((c) => {
              const isEditing = editingId === c.id;
              
              if (isEditing) {
                return (
                  <div key={c.id} className="space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-md">
                    <Input
                      autoFocus
                      placeholder="Tên Category"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm h-9"
                    />
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className={cn(
                            "w-5 h-5 rounded-full cursor-pointer ring-offset-slate-900 border border-black/15 transition-all hover:scale-110 duration-200",
                            editColor === color ? "ring-2 ring-white scale-105 shadow-md" : "opacity-85 hover:opacity-100"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}

                      {!CATEGORY_COLORS.includes(editColor) && (
                        <button
                          type="button"
                          onClick={() => editCategoryColorInputRef.current?.click()}
                          className="w-5 h-5 rounded-full border border-white ring-2 ring-white scale-105 shadow-md cursor-pointer transition-all"
                          style={{ backgroundColor: editColor }}
                          title={`Màu tự chọn: ${editColor}`}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => editCategoryColorInputRef.current?.click()}
                        className="w-5 h-5 rounded-full border border-black/15 cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-[linear-gradient(45deg,#ff0000,#00ff00,#0000ff)] opacity-85 hover:opacity-100"
                        title="Tự chọn màu khác..."
                      >
                        <span className="text-[10px] text-white font-bold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">+</span>
                      </button>
                      <input
                        ref={editCategoryColorInputRef}
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="sr-only"
                      />
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-slate-700 text-slate-300 flex-1 px-2"
                        onClick={handleCancelEdit}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-primary text-white flex-1 px-2"
                        onClick={() => handleSaveEdit(c.id)}
                      >
                        Lưu
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 bg-slate-900/50 border border-slate-800/80 rounded-md hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.color || "#64748b" }}
                    />
                    <span className="text-sm font-medium text-slate-200">{c.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                      onClick={() => handleStartEdit(c)}
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800 cursor-pointer"
                      onClick={() => handleDeleteClick(c.id, c.name)}
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end shrink-0">
          <Button variant="secondary" onClick={onClose} className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800">
            Đóng
          </Button>
        </div>
      </DialogContent>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[360px] max-w-xs rounded-3xl p-6 border-none bg-slate-950 text-slate-50 border-slate-800 shadow-2xl text-center">
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
              <HugeiconsIcon icon={Delete01Icon} size={24} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground text-center">
                Xóa Category này?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-center">
                Bạn có chắc chắn muốn xóa Category &quot;{deleteTarget?.name}&quot; không?
                Các Task và Goal liên kết với Category này sẽ tự động gỡ liên kết (không bị xóa).
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-center gap-3 pt-4 border-t border-border/40 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsConfirmDeleteOpen(false);
                setDeleteTarget(null);
              }}
              className="h-10 rounded-xl font-medium text-muted-foreground hover:text-foreground flex-1 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white flex-1 transition-all active:scale-[0.97] cursor-pointer"
            >
              Đồng ý xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
