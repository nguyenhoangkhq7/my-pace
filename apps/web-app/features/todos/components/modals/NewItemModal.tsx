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
import { cn } from "@/lib/utils";

type NewItemModalProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
};

export function NewItemModal({ open, onOpenChangeAction }: NewItemModalProps) {
  const handleSuccess = () => {
    onOpenChangeAction(false);
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent
            className={cn(
                "top-[8%]! translate-y-0!",
                "w-[520px]! max-w-[94vw]!", // Thu nhỏ bằng kích thước modal chi tiết
                "overflow-hidden rounded-2xl",
                "border border-[#1a2a44] bg-[#08101d] p-0",
                "shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
            )}
        >
          <DialogHeader className="px-5 pt-4 pb-2">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#f8fbff]">
              Create New
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7187ab] mt-0.5">
              Add a new task or category to your workspace.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="task" className="w-full">
            <div className="px-5">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-[#101b2d] p-1 border border-[#1d314f]">
                <TabsTrigger
                    value="task"
                    className="flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold tracking-wide text-[#7d93b6] data-[state=active]:bg-[#3f8cff]/15 data-[state=active]:text-[#69a8ff] data-[state=active]:border data-[state=active]:border-[#3f8cff]"
                >
                  <HugeiconsIcon icon={Task01Icon} size={14} />
                  Task
                </TabsTrigger>
                <TabsTrigger
                    value="category"
                    className="flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold tracking-wide text-[#7d93b6] data-[state=active]:bg-[#3f8cff]/15 data-[state=active]:text-[#69a8ff] data-[state=active]:border data-[state=active]:border-[#3f8cff]"
                >
                  <HugeiconsIcon icon={GridTableIcon} size={14} />
                  Category
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-5 py-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <TabsContent value="task" className="mt-0 outline-none">
                <NewTaskForm onSuccessAction={handleSuccess} />
              </TabsContent>
              <TabsContent value="category" className="mt-0 outline-none">
                <NewCategoryForm onSuccessAction={handleSuccess} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
  );
}