import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useBoardStore } from "../store/board.store";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  initialData?: Partial<Task>;
  requireDuration?: boolean;
}

const CATEGORY_COLORS = ["#64748b", "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

export function TaskFormModal({ isOpen, onClose, onSubmit, initialData, requireDuration }: TaskFormModalProps) {
  const { categories, createCategory } = useBoardStore();
  const [title, setTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState("");

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setEstimatedMinutes(initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : "");
      setNotes(initialData?.notes || "");
      setIsUrgent(initialData?.isUrgent || false);
      setIsImportant(initialData?.isImportant || false);
      setCategoryId(initialData?.categoryId || undefined);
      setDueDate(initialData?.dueDate ? new Date(initialData.dueDate) : undefined);
      setError("");
      setIsCreatingCategory(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (requireDuration && !estimatedMinutes) {
      setError("Estimated duration is required to plan this task.");
      return;
    }

    const taskData: Partial<Task> = {
      title,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      notes,
      isUrgent,
      isImportant,
      categoryId: categoryId === "none" ? undefined : categoryId,
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
    };
    onSubmit(taskData);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName, color: newCategoryColor });
      setCategoryId(cat.id);
      setIsCreatingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? (requireDuration ? "Missing Information" : "Edit Task") : "Create Task"}</DialogTitle>
          {requireDuration && (
            <DialogDescription className="text-slate-400">
              Please provide the estimated duration to add this task to your plan.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border-slate-800 focus:border-primary"
              disabled={requireDuration && !!initialData?.title}
            />
          </div>
          
          {!requireDuration && (
            <>
              <div className="grid gap-2">
                <Label>Category</Label>
                {isCreatingCategory ? (
                  <div className="space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-md">
                    <Input 
                      placeholder="Category Name" 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                      className="bg-slate-950 border-slate-800"
                    />
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_COLORS.map(c => (
                        <div 
                          key={c} 
                          onClick={() => setNewCategoryColor(c)}
                          className={cn("w-6 h-6 rounded-full cursor-pointer ring-offset-slate-900", newCategoryColor === c ? "ring-2 ring-white" : "")}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs bg-primary text-white" onClick={handleCreateCategory}>Save Category</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? undefined : val)}>
                      <SelectTrigger className="w-full bg-slate-900 border-slate-800">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                              <span>{c.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 px-3" onClick={() => setIsCreatingCategory(true)}>
                      +
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-900 border-slate-800",
                        !dueDate && "text-slate-400"
                      )}
                    >
                      <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-950 border-slate-800">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate as any}
                      className="text-slate-200"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="duration">Estimated Duration (minutes) {requireDuration && "*"}</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="bg-slate-900 border-slate-800 focus:border-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="urgent" 
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-primary focus:ring-primary focus:ring-offset-slate-950"
              />
              <Label htmlFor="urgent" className="cursor-pointer">Urgent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="important" 
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-primary focus:ring-primary focus:ring-offset-slate-950"
              />
              <Label htmlFor="important" className="cursor-pointer">Important</Label>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-900 border-slate-800 focus:border-primary min-h-[80px]"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white">
            {requireDuration ? "Continue" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
