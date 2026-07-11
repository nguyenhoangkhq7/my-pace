import { TaskFormModal } from "./TaskFormModal";
import { GoalDetailModal } from "@/features/goal/components/GoalDetailModal";
import { EisenhowerQuadrant } from "./EisenhowerQuadrant";
import { GoalBacklogSection } from "./GoalBacklogSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, FilterIcon } from "@hugeicons/core-free-icons";
import { useBacklogMatrix } from "../hooks/useBacklogMatrix";
import { useTranslation } from "@/hooks/use-translation";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";

export function BacklogMatrix() {
  const { t } = useTranslation();
  const { isTourActive, tourStepIndex, advanceTourStep } = useOnboardingStore();
  const {
    tasks,
    isPlanningMode,
    plannedTaskIds,
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    editingTask,
    setEditingTask,
    requireDurationForTask,
    setRequireDurationForTask,
    prefilledGoalForTask,
    setPrefilledGoalForTask,
    isGoalDetailModalOpen,
    setIsGoalDetailModalOpen,
    selectedGoalForDetail,
    goals,
    selectedFilterId,
    setFilter,
    categories,

    // Handlers
    handleCreateTask,
    handleGoalClick,
    handleTaskClick,
    handleMissingDurationSubmit,
  } = useBacklogMatrix();

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex bg-muted p-1 rounded-lg border border-border">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            {t.eisenhower.matrixName}
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => setActiveTab('goals')}
          >
            {t.eisenhower.goalBacklogName}
          </button>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'tasks' && (
            <Select 
              value={selectedFilterId || "none"} 
              onValueChange={(val) => setFilter(val === "none" ? null : val)}
            >
              <SelectTrigger className="h-8 border-border bg-card text-foreground w-[180px] cursor-pointer">
                <div className="flex items-center">
                  <HugeiconsIcon icon={FilterIcon} size={16} className="mr-2" />
                  <SelectValue placeholder={t.common.filter} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="none">{t.common.allTasks}</SelectItem>
                <SelectItem value="goal">{t.taskForm.goalLabel}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            className="h-8 bg-primary hover:bg-primary/90 text-white cursor-pointer tour-new-task-btn"
            onClick={() => {
              setEditingTask(undefined);
              setIsModalOpen(true);
              if (isTourActive && tourStepIndex === 1) {
                setTimeout(() => advanceTourStep(), 400);
              }
            }}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
            {t.board.newTask}
          </Button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
          <EisenhowerQuadrant
            title={`${t.eisenhower.q1Label}: ${t.eisenhower.q1Action}`}
            isUrgent={true}
            isImportant={true}
            colorClass="text-red-400"
            tasks={tasks}
            plannedTaskIds={plannedTaskIds}
            isPlanningMode={isPlanningMode}
            selectedFilterId={selectedFilterId}
            onTaskClick={handleTaskClick}
          />
          <EisenhowerQuadrant
            title={`${t.eisenhower.q2Label}: ${t.eisenhower.q2Action}`}
            isUrgent={false}
            isImportant={true}
            colorClass="text-blue-400"
            tasks={tasks}
            plannedTaskIds={plannedTaskIds}
            isPlanningMode={isPlanningMode}
            selectedFilterId={selectedFilterId}
            onTaskClick={handleTaskClick}
          />
          <EisenhowerQuadrant
            title={`${t.eisenhower.q3Label}: ${t.eisenhower.q3Action}`}
            isUrgent={true}
            isImportant={false}
            colorClass="text-yellow-400"
            tasks={tasks}
            plannedTaskIds={plannedTaskIds}
            isPlanningMode={isPlanningMode}
            selectedFilterId={selectedFilterId}
            onTaskClick={handleTaskClick}
          />
          <EisenhowerQuadrant
            title={`${t.eisenhower.q4Label}: ${t.eisenhower.q4Action}`}
            isUrgent={false}
            isImportant={false}
            colorClass="text-slate-400"
            tasks={tasks}
            plannedTaskIds={plannedTaskIds}
            isPlanningMode={isPlanningMode}
            selectedFilterId={selectedFilterId}
            onTaskClick={handleTaskClick}
          />
        </div>
      ) : (
        <GoalBacklogSection
          goals={goals}
          isPlanningMode={isPlanningMode}
          onGoalClick={handleGoalClick}
        />
      )}

      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(undefined);
          setPrefilledGoalForTask(undefined);
        }} 
        onSubmit={handleCreateTask}
        initialData={editingTask}
        prefilledGoalId={prefilledGoalForTask}
        requireDuration={!!prefilledGoalForTask}
        isUrgent={!!prefilledGoalForTask ? false : undefined}
        isImportant={!!prefilledGoalForTask ? true : undefined}
      />

      <TaskFormModal 
        isOpen={!!requireDurationForTask} 
        onClose={() => setRequireDurationForTask(undefined)} 
        onSubmit={handleMissingDurationSubmit}
        initialData={requireDurationForTask}
        requireDuration={true}
      />

      <GoalDetailModal 
        isOpen={isGoalDetailModalOpen} 
        onOpenChange={setIsGoalDetailModalOpen} 
        goal={selectedGoalForDetail} 
      />
    </div>
  );
}
