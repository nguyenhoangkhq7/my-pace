import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Task } from "../types";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  initialData?: Partial<Task>;
  requireDuration?: boolean;
}

export function TaskFormModal({ isOpen, onClose, onSubmit, initialData, requireDuration }: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setEstimatedMinutes(initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : "");
      setNotes(initialData?.notes || "");
      setIsUrgent(initialData?.isUrgent || false);
      setIsImportant(initialData?.isImportant || false);
      setError("");
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
    };
    onSubmit(taskData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-50 border-slate-800">
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
