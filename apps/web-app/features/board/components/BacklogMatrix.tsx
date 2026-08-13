import { TaskFormModal } from "./TaskFormModal";
import { EisenhowerQuadrant } from "./EisenhowerQuadrant";
import { BacklogMatrixHeader } from "./BacklogMatrixHeader";
import { SwapTaskModal } from "./SwapTaskModal";

import { useBacklogMatrix } from "../hooks/useBacklogMatrix";
import { usePlanMyDay } from "../hooks/usePlanMyDay";
import { useTranslation } from "@/hooks/use-translation";
import { useBoardStore } from "../store/board.store";


export function BacklogMatrix({ 
  currentDate, 
  tomorrowDate
}: { 
  currentDate: string;
  tomorrowDate: string;
}) {
  const { t } = useTranslation();

  const {
    tasks,
    isPlanningMode,
    plannedTaskIds,
    originalPlanTaskIds,
    isTaskModalOpen,
    editingTask,
    prefilledGoalId,
    requireDuration,
    requireDurationForTask,
    setRequireDurationForTask,
    selectedFilterId,
    setFilter,
    categories,
    slackTimes,
    isTargetStarted,
    swapUrgentTask,
    setSwapUrgentTask,
    targetPlan,
    totalAvailable,

    // Handlers
    handleCreateTask,
    handleTaskClick,
    handleTaskDrop,
    handleMissingDurationSubmit,
  } = useBacklogMatrix(currentDate, tomorrowDate);

  const { planMyDay } = usePlanMyDay(currentDate);

  const openTaskModal = useBoardStore(s => s.openTaskModal);
  const closeTaskModal = useBoardStore(s => s.closeTaskModal);

  const handleSwapConfirm = async (tasksToDrop: string[]) => {
    if (!targetPlan || !swapUrgentTask) return;
    
    // Create new list of tasks
    const newTasks = targetPlan.tasks
      .filter(pt => !tasksToDrop.includes(pt.task.id))
      .map((pt, i) => ({
        taskId: pt.task.id,
        isMit: pt.isMit,
        sortOrder: i
      }));
      
    // Add the new urgent task
    newTasks.push({
      taskId: swapUrgentTask.id,
      isMit: true, // Urgent task is MIT by default
      sortOrder: newTasks.length
    });
    
    try {
      await planMyDay({
        availableMinutes: targetPlan.availableMinutes || totalAvailable,
        tasks: newTasks
      });
      setSwapUrgentTask(null);
    } catch (e) {
      console.error("Failed to swap tasks", e);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-2">
      <BacklogMatrixHeader 
        categories={categories}
        selectedFilterId={selectedFilterId}
        setFilter={setFilter}
        onNewTask={() => {
          openTaskModal(null);
        }}
      />

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 min-h-0">
        <EisenhowerQuadrant
          title={`${t.eisenhower.q1Label}: ${t.eisenhower.q1Action}`}
          isUrgent={true}
          isImportant={true}
          colorClass="text-red-400"
          tasks={tasks}
          plannedTaskIds={plannedTaskIds}
          originalPlanTaskIds={originalPlanTaskIds}
          isPlanningMode={isPlanningMode}
          selectedFilterId={selectedFilterId}
          slackTimes={slackTimes}
          onTaskClick={handleTaskClick}
          onTaskDrop={handleTaskDrop}
          isStarted={isTargetStarted}
          onSwapClick={setSwapUrgentTask}
        />
        <EisenhowerQuadrant
          title={`${t.eisenhower.q2Label}: ${t.eisenhower.q2Action}`}
          isUrgent={false}
          isImportant={true}
          colorClass="text-blue-400"
          tasks={tasks}
          plannedTaskIds={plannedTaskIds}
          originalPlanTaskIds={originalPlanTaskIds}
          isPlanningMode={isPlanningMode}
          selectedFilterId={selectedFilterId}
          slackTimes={slackTimes}
          onTaskClick={handleTaskClick}
          onTaskDrop={handleTaskDrop}
          isStarted={isTargetStarted}
          onSwapClick={setSwapUrgentTask}
        />
        <EisenhowerQuadrant
          title={`${t.eisenhower.q3Label}: ${t.eisenhower.q3Action}`}
          isUrgent={true}
          isImportant={false}
          colorClass="text-yellow-400"
          tasks={tasks}
          plannedTaskIds={plannedTaskIds}
          originalPlanTaskIds={originalPlanTaskIds}
          isPlanningMode={isPlanningMode}
          selectedFilterId={selectedFilterId}
          slackTimes={slackTimes}
          onTaskClick={handleTaskClick}
          onTaskDrop={handleTaskDrop}
          isStarted={isTargetStarted}
          onSwapClick={setSwapUrgentTask}
        />
        <EisenhowerQuadrant
          title={`${t.eisenhower.q4Label}: ${t.eisenhower.q4Action}`}
          isUrgent={false}
          isImportant={false}
          colorClass="text-slate-400"
          tasks={tasks}
          plannedTaskIds={plannedTaskIds}
          originalPlanTaskIds={originalPlanTaskIds}
          isPlanningMode={isPlanningMode}
          selectedFilterId={selectedFilterId}
          slackTimes={slackTimes}
          onTaskClick={handleTaskClick}
          onTaskDrop={handleTaskDrop}
          isStarted={isTargetStarted}
          onSwapClick={setSwapUrgentTask}
        />
      </div>

      {swapUrgentTask && targetPlan && (
        <SwapTaskModal
          isOpen={!!swapUrgentTask}
          urgentTask={swapUrgentTask}
          plannedTasks={targetPlan.tasks.map(pt => pt.task).filter(Boolean)}
          availableMinutes={targetPlan.availableMinutes || totalAvailable}
          onOpenChange={(open) => !open && setSwapUrgentTask(null)}
          onConfirmSwap={handleSwapConfirm}
        />
      )}

      <TaskFormModal 
        isOpen={isTaskModalOpen} 
        onClose={closeTaskModal} 
        onSubmit={handleCreateTask}
        initialData={editingTask || undefined}
        prefilledGoalId={prefilledGoalId || undefined}
        requireDuration={requireDuration}
        isUrgent={!!prefilledGoalId ? false : undefined}
        isImportant={!!prefilledGoalId ? true : undefined}
      />

      <TaskFormModal 
        isOpen={!!requireDurationForTask} 
        onClose={() => setRequireDurationForTask(null)} 
        onSubmit={handleMissingDurationSubmit}
        initialData={requireDurationForTask || undefined}
        requireDuration={true}
      />
    </div>
  );
}
