"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewTaskForm } from "./NewTaskForm";
import { NewCategoryForm } from "./NewCategoryForm";
import { HugeiconsIcon } from "@hugeicons/react";
import { Task01Icon, GridTableIcon } from "@hugeicons/core-free-icons";

// ── Props ───────────────────────────────────────────────────────────────────

type NewItemModalProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
};

// ── Component ───────────────────────────────────────────────────────────────

export function NewItemModal({ open, onOpenChangeAction }: NewItemModalProps) {
  const handleSuccess = () => {
    onOpenChangeAction(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="top-[8%]! translate-y-0! w-[60vw]! max-w-none! border-slate-800 bg-pace-sidebar p-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold text-slate-100">
            Create New
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Add a new task or category to your workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="task" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-800/80 p-1">
              <TabsTrigger
                value="task"
                className="flex items-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-pace-accent data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
              >
                <HugeiconsIcon icon={Task01Icon} size={14} />
                Task
              </TabsTrigger>
              <TabsTrigger
                value="category"
                className="flex items-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-pace-accent data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
              >
                <HugeiconsIcon icon={GridTableIcon} size={14} />
                Category
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 py-5">
            <TabsContent value="task" className="mt-0">
              <NewTaskForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="category" className="mt-0">
              <NewCategoryForm onSuccessAction={handleSuccess} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
