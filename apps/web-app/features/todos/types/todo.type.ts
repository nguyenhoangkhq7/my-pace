export type BoardColumn = {
  id: number;
  name: string;
  position: number;
  tasks: BoardTask[];
};

export type Board = {
  id: number;
  name: string;
  boardColumns: BoardColumn[];
};

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
  colorCode: string;
  preferredStartTime: string | null;
  preferredEndTime: string | null;
};


export const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Work: { bg: "bg-blue-500/20", text: "text-blue-200" },
  Personal: { bg: "bg-emerald-500/20", text: "text-emerald-200" },
  Learning: { bg: "bg-violet-500/20", text: "text-violet-200" },
  Health: { bg: "bg-teal-500/20", text: "text-teal-200" },
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
  | "do-now" // Urgent + Important
  | "schedule" // Not Urgent + Important
  | "delegate" // Urgent + Not Important
  | "eliminate"; // Not Urgent + Not Important


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

