// export type BoardColumn = {
//   id: number;
//   name: string;
//   position: number;
//   tasks: BoardTask[];
// };
//
// export type Board = {
//   id: number;
//   name: string;
//   boardColumns: BoardColumn[];
// };

export type EnergyLevel = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "DOING" | "IN_REVIEW" | "DONE";

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const ENERGY_COLORS: Record<EnergyLevel, { bg: string; text: string }> = {
  LOW: { bg: "bg-emerald-500/20", text: "text-emerald-200" },
  MEDIUM: { bg: "bg-amber-500/20", text: "text-amber-200" },
  HIGH: { bg: "bg-rose-500/20", text: "text-rose-300" },
};

export type Category = {
  id: number;
  name: string;
  preferredStartTime: string | null;
  preferredEndTime: string | null;
};


export type TaskBase = {
  id: number;
  categoryId: number | null;
  category: Category | null;
  parentId: number | null;
  title: string;
  description: string | null;
  isImportant: boolean;
  energyRequired: EnergyLevel | null;
  estimatedMinutes: number | null;
  dueDate: string | null; // ISO datetime
  createdAt: string;
};

export type BoardTask = TaskBase & {
  position: number;
  status: TaskStatus;
  isDone: boolean;
};

export type MatrixQuadrantType =
  | "do-now"
  | "schedule"
  | "delegate"
  | "eliminate";


export type TaskMutationInput = {
  title?: string;
  description?: string | null;
  categoryId?: number | null;
  isImportant?: boolean;
  energyRequired?: EnergyLevel | null;
  estimatedMinutes?: number | null;
  dueDate?: string | null;
  status?: TaskStatus;
  isDone?: boolean;
  parentId?: number | null;
};

export type CreateTaskInput = TaskMutationInput & {
  title: string;
};

export type UpdateTaskInput = TaskMutationInput;

export type CreateCategoryInput = {
  name: string;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
};

