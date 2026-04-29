import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { kanbanColumns } from "@/components/kanban/data";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-pace-bg text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="flex min-h-0 flex-1 flex-col px-8 pb-10">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-semibold text-slate-100">Todos</h1>
            <Button className="bg-slate-100 px-5 text-slate-900 transition hover:bg-slate-200 active:scale-95">
              + CREATE BOARD
            </Button>
          </div>
          <KanbanBoard columns={kanbanColumns} />
        </main>
      </div>
    </div>
  );
}
