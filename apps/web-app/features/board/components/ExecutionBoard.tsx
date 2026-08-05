import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StartMyDayModal } from "./StartMyDayModal";
import { PlanningModeView } from "./PlanningModeView";
import { ExecutionModeView } from "./ExecutionModeView";
import { NoPlanState } from "./NoPlanState";
import { CancelPlanDialog } from "./CancelPlanDialog";
import { PlanOverloadModal } from "./PlanOverloadModal";
import { useExecutionBoard } from "../hooks/useExecutionBoard";
import { useTranslation } from "@/hooks/use-translation";

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [, m, d] = parts;
  return `${d}/${m}`;
};

export function ExecutionBoard({ 
  currentDate, 
  tomorrowDate
}: { 
  currentDate: string; 
  tomorrowDate: string;
}) {
  const {
    tasks,
    isPlanningMode,
    planningTarget,
    setPlanningMode,
    plannedTaskIds,
    removePlannedTaskLocally,
    isStarted,
    activeTab,
    setActiveTab,
    isCancelModalOpen,
    setIsCancelModalOpen,
    isStartMyDayOpen,
    setIsStartMyDayOpen,
    isOverloadModalOpen,
    setIsOverloadModalOpen,
    currentPlan,
    currentTimeBlocks,
    currentAvailable,
    totalAvailable,
    availableData,
    handleSavePlan,
    doSavePlan,
    handleCancelPlan,
    handleRemoveExcessTasks,
  } = useExecutionBoard({ currentDate, tomorrowDate });
  const { t } = useTranslation();

  const renderContent = () => {
    // If currently in planning mode for this tab
    if (isPlanningMode && planningTarget === activeTab) {
      return (
        <PlanningModeView
          currentAvailable={currentAvailable}
          availableData={availableData ?? null}
          plannedTaskIds={plannedTaskIds}
          tasks={tasks}
          onCancel={() => setPlanningMode(false)}
          onSave={handleSavePlan}
          onRemoveTask={removePlannedTaskLocally}
        />
      );
    }

    // If a plan exists with tasks
    if (currentPlan && currentPlan.tasks && currentPlan.tasks.length > 0) {
      return (
        <ExecutionModeView
          currentPlan={currentPlan}
          currentTimeBlocks={currentTimeBlocks || []}
          currentAvailable={currentAvailable}
          totalAvailable={totalAvailable}
          availableData={availableData ?? null}
          activeTab={activeTab}
          isStarted={isStarted}
          onEditPlan={() => {
            const initialIds = currentPlan?.tasks?.map(t => t.task?.id).filter(Boolean) as string[] || [];
            setPlanningMode(true, activeTab as 'today' | 'tomorrow', initialIds);
          }}
          onStartMyDay={() => {
            setIsStartMyDayOpen(true);
          }}
          onCancelPlan={() => setIsCancelModalOpen(true)}
          onRemoveExcessTasks={handleRemoveExcessTasks}
        />
      );
    }



    // No plan yet
    return (
      <NoPlanState
        activeTab={activeTab}
        onStartPlanning={() => setPlanningMode(true, activeTab)}
      />
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border pl-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-muted border border-border flex flex-wrap">
            <TabsTrigger value="today" className="data-[state=active]:bg-card data-[state=active]:text-foreground cursor-pointer">{t.board.today}</TabsTrigger>
            <TabsTrigger value="tomorrow" className="data-[state=active]:bg-card data-[state=active]:text-foreground cursor-pointer">{t.board.tomorrow}</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="today" className="flex-1 mt-0 outline-none flex flex-col h-full overflow-hidden">
          {activeTab === 'today' && renderContent()}
        </TabsContent>
        
        <TabsContent value="tomorrow" className="flex-1 mt-0 outline-none flex flex-col h-full overflow-hidden">
          {activeTab === 'tomorrow' && renderContent()}
        </TabsContent>
      </Tabs>

      <CancelPlanDialog
        isOpen={isCancelModalOpen}
        activeTab={activeTab}
        onOpenChange={setIsCancelModalOpen}
        onCancelConfirm={handleCancelPlan}
      />

      <StartMyDayModal
        isOpen={isStartMyDayOpen}
        onClose={() => setIsStartMyDayOpen(false)}
        todayStr={currentDate}
      />

      <PlanOverloadModal
        isOpen={isOverloadModalOpen}
        onClose={() => setIsOverloadModalOpen(false)}
        overflowMinutes={Math.abs(Math.min(0, currentAvailable))}
        plannedTasks={tasks.filter(t => plannedTaskIds.includes(t.id))}
        onRemoveTask={(taskId) => removePlannedTaskLocally(taskId)}
        onSaveAnyway={doSavePlan}
      />
    </div>
  );
}
