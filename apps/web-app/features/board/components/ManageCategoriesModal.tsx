import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoardStore } from "../store/board.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete01Icon, Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS = ["#64748b", "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const { categories, updateCategory, deleteCategory } = useBoardStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState("");

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
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật Category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa Category "${name}" không?\nCác Task và Goal liên kết với Category này sẽ tự động gỡ liên kết (không bị xóa).`);
    if (!confirmed) return;

    try {
      await deleteCategory(id);
      setError("");
    } catch (err: any) {
      setError(err.message || "Không thể xóa Category");
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
                      placeholder="Tên Category"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm h-9"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_COLORS.map((color) => (
                        <div
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={cn(
                            "w-5 h-5 rounded-full cursor-pointer ring-offset-slate-900",
                            editColor === color ? "ring-2 ring-white" : ""
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
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
                      className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      onClick={() => handleDelete(c.id, c.name)}
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
    </Dialog>
  );
}
