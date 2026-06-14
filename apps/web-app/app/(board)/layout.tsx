"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TodayOverviewView, NewItemModal, TaskDetailModal, useViewStore, useModalStore } from "@/features/todos";

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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar activeView={activeView} onViewChangeAction={setActiveView} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6 scrollbar-thin">
        {children}
      </main>
      <TodayOverviewView />
      <NewItemModal open={isNewItemModalOpen} onOpenChangeAction={setIsNewItemModalOpen} />
      <TaskDetailModal />
    </div>
  );
}

