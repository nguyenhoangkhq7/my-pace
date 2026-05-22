export { BoardView } from "./BoardView";
export { MatrixView } from "./MatrixView";
export { TodayOverviewView } from "./TodayOverviewView";

// Modals mounted globally in Layout
export { NewItemModal } from "./components/modals/NewItemModal";
export { TaskDetailModal } from "./components/modals/TaskDetailModal";

// Hooks
export { useTasks } from "./hooks/useTasks";
export { useCategories } from "./hooks/useCategories";
export { useEvents } from "./hooks/useEvents";
export { useNotes } from "./hooks/useNotes";

// Stores
export { useViewStore } from "./stores/view.store";
export { useModalStore } from "./stores/modal.store";

// Types & Constants
export type {
  Category,
  TaskBase,
  TaskStatus,
  EnergyLevel,
  BoardTask,
  CreateTaskInput,
  UpdateTaskInput,
  CreateCategoryInput,
} from "./types/todo.type";

export {
  ENERGY_LABELS,
  ENERGY_COLORS,
  CATEGORY_BADGE_COLORS,
} from "./types/todo.type";