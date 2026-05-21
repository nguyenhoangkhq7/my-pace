"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { useFilterStore } from "@/stores/filter.store";
import { NewItemModal } from "@/components/modals/NewItemModal";
import { TaskDetailModal } from "@/components/modals/TaskDetailModal";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeView = useFilterStore((s) => s.activeView);
  const setActiveView = useFilterStore((s) => s.setActiveView);

  const isNewItemModalOpen = useFilterStore((s) => s.isNewItemModalOpen);
  const setIsNewItemModalOpen = useFilterStore((s) => s.setIsNewItemModalOpen);

  return (
    <div className="flex h-screen bg-pace-bg text-foreground">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6 scrollbar-thin">
        {children}
      </main>

      <RightPanel />

      <NewItemModal open={isNewItemModalOpen} onOpenChange={setIsNewItemModalOpen} />
      <TaskDetailModal />
    </div>
  );
}

