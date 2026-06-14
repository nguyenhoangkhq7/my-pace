"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewTaskForm } from "./NewTaskForm";
import { NewCategoryForm } from "./NewCategoryForm";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "radix-ui";

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
                "top-[10%]! translate-y-0!",
                "w-[480px]! max-w-[92vw]!",
                "overflow-hidden rounded-2xl",
                "border border-border bg-card p-0",
                "shadow-2xl shadow-black/40",
            )}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Create New</DialogTitle>
          </VisuallyHidden.Root>

          <Tabs defaultValue="task" className="w-full">
            {/* Compact tab header */}
            <div className="flex items-center border-b border-border px-1">
              <TabsList className="h-10 bg-transparent p-0 gap-0">
                <TabsTrigger
                    value="task"
                    className={cn(
                        "relative h-10 rounded-none border-b-2 border-transparent px-4",
                        "text-[13px] font-medium text-muted-foreground",
                        "transition-colors duration-150",
                        "data-[state=active]:border-primary data-[state=active]:text-foreground",
                        "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                        "hover:text-foreground",
                    )}
                >
                  Task
                </TabsTrigger>
                <TabsTrigger
                    value="category"
                    className={cn(
                        "relative h-10 rounded-none border-b-2 border-transparent px-4",
                        "text-[13px] font-medium text-muted-foreground",
                        "transition-colors duration-150",
                        "data-[state=active]:border-primary data-[state=active]:text-foreground",
                        "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                        "hover:text-foreground",
                    )}
                >
                  Category
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab content */}
            <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
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