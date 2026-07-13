import { TaskFormModal } from "./TaskFormModal";
import { EisenhowerQuadrant } from "./EisenhowerQuadrant";
import { BacklogMatrixHeader } from "./BacklogMatrixHeader";

import { useBacklogMatrix } from "../hooks/useBacklogMatrix";
import { useTranslation } from "@/hooks/use-translation";


export function BacklogMatrix() {
  const { t } = useTranslation();

  const {
    tasks,
    isPlanningMode,
    plannedTaskIds,
    isModalOpen,
    setIsModalOpen,
    editingTask,
    setEditingTask,
    requireDurationForTask,
    setRequireDurationForTask,
    prefilledGoalForTask,
    setPrefilledGoalForTask,
    selectedFilterId,
    setFilter,
    categories,

    // Handlers
    handleCreateTask,
    handleTaskClick,
    handleTaskDrop,
    handleMissingDurationSubmit,
  } = useBacklogMatrix();

  return (
    <div className="h-full flex flex-col space-y-4">
      <BacklogMatrixHeader 
        categories={categories}
        selectedFilterId={selectedFilterId}
        setFilter={setFilter}
        onNewTask={() => {
          setEditingTask(undefined);
          setIsModalOpen(true);
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
          isPlanningMode={isPlanningMode}
          selectedFilterId={selectedFilterId}
          onTaskClick={handleTaskClick}
          onTaskDrop={handleTaskDrop}
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
          onTaskDrop={handleTaskDrop}
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
          onTaskDrop={handleTaskDrop}
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
          onTaskDrop={handleTaskDrop}
        />
      </div>

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
    </div>
  );
}
