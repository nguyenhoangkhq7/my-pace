"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TodosBoardView } from "@/features/todos/TodosBoardView";

export default function AppLayout() {
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);

  return (
    <div className="flex h-screen bg-pace-bg text-foreground">
      <Sidebar
        selectedBoardId={selectedBoardId}
        onSelectBoard={setSelectedBoardId}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col px-8 pb-10 overflow-hidden">
          <TodosBoardView boardId={selectedBoardId} />
        </main>
      </div>
    </div>
  );
}
