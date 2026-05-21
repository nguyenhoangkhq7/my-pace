"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/dashboard/RightPanel";
import { NewItemModal } from "@/components/modals/NewItemModal";
import { TaskDetailModal } from "@/components/modals/TaskDetailModal";
import { useViewStore } from "@/stores/view.store";
import { useModalStore } from "@/stores/modal.store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeView = useViewStore((s) => s.activeView);
  const setActiveView = useViewStore((s) => s.setActiveView);

  const isNewItemModalOpen = useModalStore((s) => s.isNewItemModalOpen);
  const setIsNewItemModalOpen = useModalStore((s) => s.setIsNewItemModalOpen);

  return (
    <div className="flex h-screen bg-pace-bg text-foreground">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6 scrollbar-thin">
        {children}
      </main>

      <RightPanel />

      <NewItemModal open={isNewItemModalOpen} onOpenChangeAction={setIsNewItemModalOpen} />
      <TaskDetailModal />
    </div>
  );
}

